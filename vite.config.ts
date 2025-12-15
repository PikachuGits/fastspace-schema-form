import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src'],
      rollupTypes: true,
      tsconfigPath: './tsconfig.json'
    })
  ],
  esbuild: {
    drop: ['console', 'debugger'],
  },
  build: {
    lib: {
      entry: resolve('src/index.tsx'),
      name: 'SchemaFormLib',
      fileName: 'schema-form-lib',
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@mui/material',
        '@mui/icons-material',
        '@emotion/react',
        '@emotion/styled',
        'react-hook-form',
        '@hookform/resolvers',
        '@mui/x-date-pickers/AdapterDayjs',
        '@mui/x-date-pickers/DatePicker',
        '@mui/x-date-pickers/TimePicker',
        '@mui/x-date-pickers/DateTimePicker',
        '@mui/x-date-pickers',
        'dayjs',
        'dayjs/locale/zh-cn',
        'valibot'
      ],
      output: {
        exports: 'named',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@mui/material': 'MaterialUI',
          'react-hook-form': 'ReactHookForm',
          dayjs: 'dayjs',
          valibot: 'Valibot'
        }
      }
    }
  }
});
