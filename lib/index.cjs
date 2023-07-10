const { fetch } = require('undici');
const { load } = require('cheerio');
const fonts = [
    'https://www.letras.mus.br',
    'https:/www.letras.com'
];

async function GoogleSearch(query) {
    const HTML = await fetch(`https://www.google.com/search?query=${encodeURIComponent(query)}%20letra`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36',
            'Accept-Language': 'pt-BR',
            'Content-Type': 'text/html'
        }
    })
        .then((e) => e.text());
    const $ = load(HTML, { lowerCaseTags: true });
    const values = $('a')
        .map((_, el) => $(el)
                .attr('href')
                ?.replace('/url?q=', '')
                ?.split('&')?.[0])
        .toArray()
        .filter((url) => (url && 
            /(https?:\/\/)?[a-z\.-]+\/.+/gi.test(url) &&
            fonts.some((font) => url.includes(font))));
        
        return values[0];
}

module.exports = async(query) => {
    if (!query || typeof query !== 'string') throw new TypeError(`The parameter "query" must be of type string, received: ${typeof query}`);
    
    const url = await GoogleSearch(query);
    
    if (!url) throw new Error(`Cannot find results to: ${query}`);
    
    const HTML = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36',
            'Accept-Language': 'pt-BR',
            'Content-Type': 'text/html'
        }
    })
        .then((e) => e.text());
    const $ = load(HTML, { lowerCaseTags: true });
    const data = { font: url, title: '', author: '' };
    
    if ($('title').text().split('-').length >= 3) {
        const [title, author] = $('title').text().split('-');
        
        data.title = title
            .replace(/\(.*?\)/g, '')
            .toLowerCase()
            .trim()
            .split(/\s+/)
            .map((word) => word[0].toUpperCase() + word.slice(1))
            .join(' ');
        data.author = author.trim();
    }
    if ($('.cnt-trad_l').length) {
        data.lyrics = $('.cnt-trad_l')
            .html()
            .replace(/<h3[^>]*>.*?<\/h3>/g, '')
            .replace(/<\/?span>/g, '')
            .replace(/<.*?>/g, '\n')
            .replace(/\n{3}/g, '\n\n');
    } else if ($('.cnt-letra').length) {
        data.lyrics = $('.cnt-letra')
            .toString()
            .replace(/<.*?>/g, '\n');
    } else data.lyrics = null;
    
    data.lyrics = data.lyrics
        ? data.lyrics
            .trim()
            .split(/\n/)
        : '';
    
    return data;
}
