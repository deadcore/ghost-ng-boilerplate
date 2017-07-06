const {
    FuseBox,
    SassPlugin,
    CSSPlugin,
    WebIndexPlugin,
    JSONPlugin,
    HTMLPlugin,
    Sparky,
    QuantumPlugin
} = require('fuse-box');

const GhostBootstrap = require('./ghost-bootstrap');

const outDir = './dist/themes/casper';
const pages = ['author', 'default', 'error', 'index', 'page', 'post', 'tag'];
const fs = require('fs');

let fuse, app, vendor, isProduction;

Sparky.task("config", () => {
    fuse = FuseBox.init({
        homeDir: `src/`,
        output: `${outDir}/assets/$name.js`,
        sourceMaps: !isProduction,
        hash: isProduction,
        target: "browser",
        experimentalFeatures: true,
        cache: !isProduction,
        plugins: [
            ["*.scss", SassPlugin(), CSSPlugin()],
            isProduction && QuantumPlugin({
                treeshake: true,
                removeExportsInterop: false,
                uglify: true
            })
        ],
        shim: {
            jquery: {
                source: "node_modules/jquery/dist/jquery.js",
                exports: "$"
            },
        }
    });

    vendor = fuse
        .bundle('vendor')
        .instructions(' ~ **/**.ts');

    const splitBundler = (bundler, page) => bundler.split(`pages/${page}/**`, `${page} > pages/${page}/${page}.ts`);

    app = pages.reduce(splitBundler, fuse
        .bundle('app')
        .splitConfig({ browser: "assets", dest: "./" }))
        .instructions(`> [app.ts] + [pages/**/**.ts]`)

});

pages.forEach(page => {
    Sparky.task(`handlebars:${page}`, () => Sparky
        .watch("**/**.hbs", { base: `./src/pages/${page}` })
        .dest(outDir)
    );
});

Sparky.task('handlebars', ['handlebars:partials', ...pages.map(x => `handlebars:${x}`)], () => {
});

Sparky.task('handlebars:partials', () => Sparky.src('partials/**/**.hbs', { base: `./src` }).dest(outDir));

Sparky.task('package', () => {

    const { name, version, author } = require('./package.json');

    const json = JSON.stringify({ name, version, author });

    return fs.writeFile(`${outDir}/package.json`, json);
});

Sparky.task("default", ["clean", "config", "handlebars", 'package'], () => {
    fuse.dev();
    // add dev instructions
    app.watch().hmr();

    Sparky.start('ghost');

    return fuse.run();
});

Sparky.task("clean", () => Sparky.src("dist/").clean(outDir));

Sparky.task("prod-env", ["clean"], () => {
    isProduction = true
});

Sparky.task("dist", ["prod-env", "config"], () => {
    // comment out to prevent dev server from running (left for the demo)
    fuse.dev();
    return fuse.run();
});

Sparky.task('ghost', () => new GhostBootstrap().start());
