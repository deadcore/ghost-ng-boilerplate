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

let fuse, app, vendor, isProduction;

const footer = (page) => `{{#contentFor "ghostPageScript"}}<script>(function () {window.ghost||(window.ghost={modules:[]}),window.ghost.modules.push('${page}')})();</script>{{/contentFor}}`;

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

    app = fuse
        .bundle('app')
        .splitConfig({ browser: "assets", dest: "./" })
        .split("pages/index/**", "index > pages/index/index.ts")
        .split("pages/post/**", "post > pages/post/post.ts")
        .split("pages/page/**", "page > pages/page/page.ts")
        .split("pages/tag/**", "tag > pages/tag/tag.ts")
        .split("pages/default/**", "default > pages/default/default.ts")
        .split("pages/error/**", "error > pages/error/error.ts")
        .instructions(`> [app.ts] + [pages/**/**.ts]`)

});

pages.forEach(page => {
    Sparky.task(`handlebars:${page}`, () => Sparky
        .watch("**/**.hbs", { base: `./src/pages/${page}` })
        .file("*.hbs", appendFooter)
        .dest(outDir)
    );
});

const appendFooter = (file) => {
    // append the footer
    if (file.name !== 'error.hbs') {
        file.read();
        file.setContent(file.contents + footer(file.name.split('.')[0]));
    }
    return file;
};


Sparky.task('handlebars', ['handlebars:partials', ...pages.map(x => `handlebars:${x}`)], () => {
});

Sparky.task('handlebars:partials', () => Sparky.src('partials/**/**.hbs', { base: `./src` }).dest(outDir));

Sparky.task('package', () => Sparky
    .src('package.json')
    .file("package.json", file => file.json())
    .dest(outDir)
);

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
