import './compoents/infinite-scroll'

if (isPage('author')) {
    import('./pages/author/author')
}

if (isPage('default')) {
    import('./pages/default/default')
}

if (isPage('error')) {
    import('./pages/error/error')
}

if (isPage('index')) {
    import('./pages/index/index')
}

if (isPage('page')) {
    import('./pages/page/page')
}

if (isPage('post')) {
    import('./pages/post/post')
}

if (isPage('tag')) {
    import('./pages/tag/tag')
}

function isPage(target: string) {
    return window.ghost.modules.indexOf(target) >= 0
}