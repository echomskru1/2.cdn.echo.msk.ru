window.isOperaMini = (window.opr && opr.addons) || window.opera || (navigator.userAgent.indexOf(' OPR/') >= 0) || Object.prototype.toString.call(window.operamini) === "[object OperaMini]";

window.is_adaptive = (!getCookie('not_adaptive') || getCookie('not_adaptive') === '0') && (getCurrentWidth() <= getMaxWidth()) && !window.isOperaMini;

if (window.is_adaptive) {
    document.getElementsByTagName('html')[0].className += ' adaptive';
}

function getCookie(name) {
    var matches = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

function getCurrentWidth() {
    // return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    return $(window).width();
}

function getMaxWidth() {
    return 767;
}

/**
 * Расстановка баннеров
 */
function adv_insert(name, banner_name) {
    var banner_name = banner_name || name || '',
        OA_output = window.OA_output || [];

    if (!OA_output[banner_name]) {
        return;
    }

    $('#' + name).append(OA_output[banner_name]);
}

/**
 * Функция что-то делает с баннерами
 */
function markup() { function t(t, e) { return a && console.log(t), e } function e(t, e, o, n) { var i = '<div id="inside_adv_' + e + '" class="' + o + '" style="float:left;">'; a && (i += '<div style="background:yellow; width:' + _ + "px; height:" + r + 'px;">' + e + "</div>"), i += "</div>", t.after(i) } function o(e) { t('\t check is_adv_nearby for pObj started with "' + e.p.text().substring(0, 40).trim() + '" top_offset=' + parseInt(e.offset_top) + ", bottom_offset=" + parseInt(e.offset_top + e.height)); for (var o, n = e.offset_bottom - i.offset().top, a = d.length - 1; a >= 0; a--)o = Math.abs(e.offset_bottom - d[a].offset_bottom), d[a].can_ad_after && n > o && (n = o); return n < s && t("\t min_ad_space cathed:" + parseInt(n) + " <min:" + s, !0) } function n(e) { var o, n = 0; a && console.log('\t check is_media_nearby for pObj started with "' + e.p.text().substring(0, 40).trim() + '" top_offset=' + parseInt(e.offset_top) + ", bottom_offset=" + parseInt(e.offset_top + e.height)); for (var i = 0; i < h.length; i++) { if (o = e.offset_top - h[i].bottom, n = h[i].top - e.offset_bottom, t("\t\thow far the media:=" + i + ", top_offset=" + parseInt(o) + ", bottom_offset=" + parseInt(n)), Math.abs(o) < f) return t("\t media" + i + " near top", !0); if (Math.abs(n) < f) return t("\t media:" + i + " near bottom", !0) } return t(" no media nearby!", !1) } var a = 0; -1 !== location.search.indexOf("?ml=") && (a = 1), a && console.time("markup"); var i = $(".typical:first"), s = 1e3, f = 400, r = 20, _ = 20, d = new Array, h = new Array; i.find("img, iframe, table, tr, td, blockquote, :header").each(function (e) { var o = $(this), n = {}; n.top = o.offset().top, n.bottom = n.top + (o.height() || 200), t(" mObj:" + o[0].nodeName + ", n:" + e + ",  top=" + parseInt(n.top) + ", bottom=" + parseInt(n.bottom)), h.push(n) }), e_obj = {}; try { e_obj.top = e_obj.bottom = i.offset().top + i.height() } catch (t) { var l = 1; return } if (!l) { h.push(e_obj), a && console.log("total lenght of all elements in typical is:" + i.find("> *").length), $(".typical > *").each(function (t) { var e = $(this), i = {}; a && console.log("I =" + t), e.is("p,br") && (i.p = e, i.height = e.height(), i.offset_top = e.offset().top, i.offset_bottom = i.offset_top + i.height, i.can_ad_after = !0, a && console.log(" find P( " + e[0].nodeName + ") in " + t), a && console.log(" , offset Top: " + i.offset_top + ", offset_bottom: " + i.offset_bottom), n(i) && (i.can_ad_after = !1), o(i) && (i.can_ad_after = !1), d.push(i)) }), a && console.log("each ended"); for (p = d.length - 1; p >= 0; p--)d[p].can_ad_after || d.splice(p, 1); d.length ? e(d[0].p, 1, "video_adv_1") : e(i, 1, "video_adv_1"), $("#inside_adv_1").after("<span class=empty_span></span>"); for (var p = d.length - 1; p > 0; p--)e(d[p].p, p + 1, "adv_inside"); d.length > 1 && adv_insert("inside_adv_2", "in_article_1"), d.length > 2 && adv_insert("inside_adv_3", "in_article_2"), d.length > 3 && adv_insert("inside_adv_4", "in_article_3"), d.length > 4 && adv_insert("inside_adv_5", "in_article_4"), d.length > 4 && adv_insert("inside_adv_6", "in_article_5"), a && $('[id^="inside_adv"]').bind("DOMSubtreeModified", function () { console.log("div with id=" + this.id + " changed"), console.log("    content height is" + $(this).innerHeight()) }), a && console.timeEnd("markup") } }
;
