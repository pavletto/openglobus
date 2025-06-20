import path from 'node:path';
import {fileURLToPath} from 'node:url';
import terser from '@rollup/plugin-terser';
import {viteStaticCopy} from 'vite-plugin-static-copy';
import forceTerserPlugin from './vite-plugin-force-terser.js';
import glsl from 'vite-plugin-glsl';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * @param {{ mode: 'development' | 'production' }} param0
 * @returns {import('vite').UserConfig}
 */
export default function ({mode}: { mode: 'development' | 'production' }) {
    const isDev = mode === 'development';

    return {
        build: {
            minify: !isDev,
            lib: {
                entry: ['./src/index.ts'],
                name: 'og',
                fileName: 'og',
                formats: ['es'],
                cssFileName: 'og',
            },
            emptyOutDir: true,
            outDir: path.resolve(__dirname, './lib'),
            sourcemap: true,
            rollupOptions: {
                output: {
                    entryFileNames: `og.[format].js`,
                    assetFileNames: `[name][extname]`,
                    sourcemapExcludeSources: true,
                },
                plugins: [
                    // doesn't work for esm modules
                    terser({
                        compress: true,
                        mangle: true,
                        format: {
                            comments: false
                        }
                    })
                ]
            }
        },
        plugins: [
            glsl({
                include: [                      // Glob pattern, or array of glob patterns to import
                    '**/*.glsl', '**/*.wgsl',
                    '**/*.vert', '**/*.frag',
                    '**/*.vs', '**/*.fs'
                ],
                defaultExtension: 'glsl',
                exclude: undefined,
                warnDuplicatedImports: true,
                removeDuplicatedImports: false,
                minify: !isDev,
                watch: true,
                root: '/'
            }),
            // this works for esm modules
            !isDev && forceTerserPlugin({filePath: "./lib/og.es.js"}),
            viteStaticCopy({
                targets: [
                    {
                        src: './res/',
                        dest: './'
                    }
                ]
            })
        ],
        server: {
            port: 3000,
            host: '0.0.0.0',
            open: true,
            // fs: {
            //     strict: true,
            //     allow: ['src']
            // },
            watch: {
                ignored: [
                    '!**/*.glsl',
                    '!**/res/**'
                ]
            }
        },
        optimizeDeps: {
            noDiscovery: true,
            include: []
        },
    };
}
