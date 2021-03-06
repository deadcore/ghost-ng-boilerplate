const {
    FuseBox,
    SassPlugin,
    CSSPlugin,
    WebIndexPlugin,
    JSONPlugin,
    HTMLPlugin,
    Sparky,
    QuantumPlugin,
    RawPlugin,
    TypeScriptHelpers
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
        target: 'browser',
        debug: true,
        cache: !isProduction,
        plugins: [
            ['*.scss', SassPlugin({ indentedSyntax: false, importer: true, sourceMap: false, outputStyle: 'compressed' }), CSSPlugin()],
            isProduction && QuantumPlugin({
                target: 'browser',
                bakeApiIntoBundle : 'vendor',
                treeshake : true,
                ensureES5 : true,
                uglify: true
            })
        ]
    });

    vendor = fuse
        .bundle('vendor')
        .instructions(' ~ **/**.ts');

    app = fuse.bundle('app')
        .instructions(`> [app.ts]`);

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
    const { name, version, author, config, description, engines, license, gpm, screenshots, demo, homepage } = require('./package.json');
    const json = JSON.stringify({
        name,
        version,
        author,
        config,
        description,
        engines,
        license,
        gpm,
        screenshots,
        demo,
        homepage
    });
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
