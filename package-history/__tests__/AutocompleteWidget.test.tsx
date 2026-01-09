import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import { AutocompleteWidget } from "../ui/widgets/AutocompleteWidget";
import type { OptionItem, FieldSchema, RemoteConfig } from "../types";

// 创建测试主题
const theme = createTheme();

// 包装组件，提供必要的 Provider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

// 模拟数据
const mockOptions: OptionItem[] = [
  { label: "选项一", value: "1" },
  { label: "选项二", value: "2" },
  { label: "选项三", value: "3" },
  { label: "选项四", value: "4" },
  { label: "选项五", value: "5" },
];

// 创建模拟 field 对象
const createMockField = (value: unknown = null) => ({
  value,
  name: "testField",
  onChange: vi.fn(),
  onBlur: vi.fn(),
  ref: vi.fn(),
});

// 创建模拟远程配置
const createMockRemoteConfig = (
  options?: Partial<RemoteConfig>
): RemoteConfig => {
  const fetchOptions = vi
    .fn()
    .mockImplementation(
      async (keyword: string, page: number, pageSize: number) => {
        // 模拟网络延迟
        await new Promise((resolve) => setTimeout(resolve, 10));

        let filteredOptions = mockOptions;
        if (keyword) {
          filteredOptions = mockOptions.filter((o) =>
            o.label.includes(keyword)
          );
        }

        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const paginatedData = filteredOptions.slice(start, end);

        return {
          data: paginatedData,
          total: filteredOptions.length,
          hasMore: end < filteredOptions.length,
        };
      }
    );

  const fetchById = vi
    .fn()
    .mockImplementation(async (value: string | number) => {
      // 模拟网络延迟
      await new Promise((resolve) => setTimeout(resolve, 10));
      return (
        mockOptions.find(
          (o) => o.value === value || o.value === String(value)
        ) ?? null
      );
    });

  return {
    fetchOptions,
    fetchById,
    pageSize: 20,
    debounceTimeout: 50,
    ...options,
  };
};

describe("AutocompleteWidget - 远程搜索默认值场景", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("基础渲染", () => {
    it("应该正确渲染组件", () => {
      const field = createMockField();

      render(
        <TestWrapper>
          <AutocompleteWidget
            field={field as any}
            label="测试字段"
            options={mockOptions}
          />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/测试字段/)).toBeInTheDocument();
    });
  });

  describe("默认值回显 (fetchById)", () => {
    it("有默认值时，应该调用 fetchById 获取选项", async () => {
      const remoteConfig = createMockRemoteConfig();
      const field = createMockField("2"); // 默认选中值为 '2'

      const schema: FieldSchema = {
        name: "testField",
        component: "Autocomplete",
        ui: { remoteConfig },
      };

      render(
        <TestWrapper>
          <AutocompleteWidget
            field={field as any}
            label="测试字段"
            schema={schema}
            fieldProps={{}}
          />
        </TestWrapper>
      );

      // 等待 fetchById 被调用
      await waitFor(() => {
        expect(remoteConfig.fetchById).toHaveBeenCalledWith("2");
      });
    });

    it("无默认值时，不应该调用 fetchById", async () => {
      const remoteConfig = createMockRemoteConfig();
      const field = createMockField(null);

      const schema: FieldSchema = {
        name: "testField",
        component: "Autocomplete",
        ui: { remoteConfig },
      };

      render(
        <TestWrapper>
          <AutocompleteWidget
            field={field as any}
            label="测试字段"
            schema={schema}
            fieldProps={{}}
          />
        </TestWrapper>
      );

      // 等待一段时间确保不会调用
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(remoteConfig.fetchById).not.toHaveBeenCalled();
    });

    it("多选模式下有默认值时，应该为每个值调用 fetchById", async () => {
      const remoteConfig = createMockRemoteConfig();
      const field = createMockField(["1", "3"]); // 默认选中多个值

      const schema: FieldSchema = {
        name: "testField",
        component: "Autocomplete",
        ui: { remoteConfig },
      };

      render(
        <TestWrapper>
          <AutocompleteWidget
            field={field as any}
            label="测试字段"
            schema={schema}
            fieldProps={{ multiple: true }}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(remoteConfig.fetchById).toHaveBeenCalledTimes(2);
        expect(remoteConfig.fetchById).toHaveBeenCalledWith("1");
        expect(remoteConfig.fetchById).toHaveBeenCalledWith("3");
      });
    });
  });

  describe("防止首次打开闪烁", () => {
    it("有默认值且已加载选项时，首次打开不应该触发额外的 fetchOptions", async () => {
      const remoteConfig = createMockRemoteConfig();
      const field = createMockField("2");

      const schema: FieldSchema = {
        name: "testField",
        component: "Autocomplete",
        ui: { remoteConfig },
      };

      render(
        <TestWrapper>
          <AutocompleteWidget
            field={field as any}
            label="测试字段"
            schema={schema}
            fieldProps={{}}
          />
        </TestWrapper>
      );

      // 等待 fetchById 完成
      await waitFor(() => {
        expect(remoteConfig.fetchById).toHaveBeenCalledWith("2");
      });

      // 额外等待确保初始化完成
      await new Promise((resolve) => setTimeout(resolve, 30));

      // 重置 mock 调用计数
      (remoteConfig.fetchOptions as ReturnType<typeof vi.fn>).mockClear();

      // 打开下拉
      const input = screen.getByRole("combobox");
      await act(async () => {
        fireEvent.click(input);
      });

      // 等待一小段时间
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 首次打开，因为已有选中项且有数据，不应该触发 fetchOptions
      expect(remoteConfig.fetchOptions).not.toHaveBeenCalled();
    });
  });

  describe("搜索功能", () => {
    it("输入关键词应该触发搜索", async () => {
      const remoteConfig = createMockRemoteConfig();
      const field = createMockField(null);

      const schema: FieldSchema = {
        name: "testField",
        component: "Autocomplete",
        ui: { remoteConfig },
      };

      render(
        <TestWrapper>
          <AutocompleteWidget
            field={field as any}
            label="测试字段"
            schema={schema}
            fieldProps={{}}
          />
        </TestWrapper>
      );

      const input = screen.getByRole("combobox");

      // 打开下拉
      await act(async () => {
        fireEvent.click(input);
      });

      // 等待初始化
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 清除之前的调用
      (remoteConfig.fetchOptions as ReturnType<typeof vi.fn>).mockClear();

      // 输入关键词
      await act(async () => {
        fireEvent.change(input, { target: { value: "选项一" } });
      });

      // 等待防抖
      await waitFor(
        () => {
          expect(remoteConfig.fetchOptions).toHaveBeenCalledWith(
            "选项一",
            1,
            20
          );
        },
        { timeout: 200 }
      );
    });
  });

  describe("错误处理", () => {
    it("fetchById 失败时应该优雅处理", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const failingFetchById = vi
        .fn()
        .mockRejectedValue(new Error("Network error"));
      const remoteConfig = createMockRemoteConfig({
        fetchById: failingFetchById,
      });
      const field = createMockField("2");

      const schema: FieldSchema = {
        name: "testField",
        component: "Autocomplete",
        ui: { remoteConfig },
      };

      // 组件应该渲染而不崩溃
      render(
        <TestWrapper>
          <AutocompleteWidget
            field={field as any}
            label="测试字段"
            schema={schema}
            fieldProps={{}}
          />
        </TestWrapper>
      );

      // 验证 fetchById 被调用
      await waitFor(() => {
        expect(failingFetchById).toHaveBeenCalled();
      });

      // 验证错误被记录
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      // 组件仍然可以正常使用
      expect(screen.getByRole("combobox")).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe("初始化状态", () => {
    it("组件应该正确处理初始化状态转换", async () => {
      const remoteConfig = createMockRemoteConfig();
      const field = createMockField("2");

      const schema: FieldSchema = {
        name: "testField",
        component: "Autocomplete",
        ui: { remoteConfig },
      };

      render(
        <TestWrapper>
          <AutocompleteWidget
            field={field as any}
            label="测试字段"
            schema={schema}
            fieldProps={{}}
          />
        </TestWrapper>
      );

      // 组件应该正常渲染
      expect(screen.getByRole("combobox")).toBeInTheDocument();

      // 等待 fetchById 完成
      await waitFor(() => {
        expect(remoteConfig.fetchById).toHaveBeenCalled();
      });
    });

    it("无 fetchById 时应该直接标记为 ready 状态", async () => {
      const remoteConfig: RemoteConfig = {
        fetchOptions: vi
          .fn()
          .mockResolvedValue({ data: mockOptions, total: 5, hasMore: false }),
        pageSize: 20,
        // 注意：没有 fetchById
      };
      const field = createMockField(null);

      const schema: FieldSchema = {
        name: "testField",
        component: "Autocomplete",
        ui: { remoteConfig },
      };

      render(
        <TestWrapper>
          <AutocompleteWidget
            field={field as any}
            label="测试字段"
            schema={schema}
            fieldProps={{}}
          />
        </TestWrapper>
      );

      // 组件应该正常渲染（没有 fetchById 时不需要等待初始化）
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });
});

describe("AutocompleteWidget - 非远程模式", () => {
  it("非远程模式应该使用传入的 options", () => {
    const field = createMockField("2");

    render(
      <TestWrapper>
        <AutocompleteWidget
          field={field as any}
          label="测试字段"
          options={mockOptions}
        />
      </TestWrapper>
    );

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });
});
