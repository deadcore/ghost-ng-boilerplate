import * as $ from 'jquery'

const maxPages = 25;

// Code snippet inspired by https://github.com/douglasrodrigues5/ghost-blog-infinite-scroll
$().ready(() => {
    let page = 2,
        blogUrl = window.location,
        $result = $('.post-feed');

    $(window).scroll(() => {
        if ($(window).scrollTop() + $(window).height() == $(document).height()) {
            if (page <= maxPages) {
                $.get((blogUrl + '/page/' + page), (content) => {
                    $result.append($(content).find('.post').hide().fadeIn(100));
                    page = page + 1;
                });
            }
        }
    });
});
