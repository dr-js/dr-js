// https://eastmanreference.com/complete-list-of-html-tags
const HTML_TAG_NAME_LIST = 'a|abbr|address|area|article|aside|audio|b|base|bdi|bdo|blockquote|body|br|button|canvas|caption|cite|code|col|colgroup|data|datalist|dd|del|details|dfn|dialog|div|dl|dt|em|embed|fieldset|figure|footer|form|h1|h2|h3|h4|h5|h6|head|header|hgroup|hr|html|i|iframe|img|input|ins|kbd|keygen|label|legend|li|link|main|map|mark|menu|menuitem|meta|meter|nav|noscript|object|ol|optgroup|option|output|p|param|pre|progress|q|rb|rp|rt|rtc|ruby|s|samp|script|section|select|small|source|span|strong|style|sub|summary|sup|table|tbody|td|template|textarea|tfoot|th|thead|time|title|tr|track|u|ul|var|video|wbr'.split('|')

// https://html.spec.whatwg.org/multipage/syntax.html#void-elements
const HTML_VOID_TAG_NAME_LIST = 'area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr'.split('|')

// copied from MDN tag sample
window.addContent(``, `
<select name="pets" id="pet-select">
  <option value="">--Please choose an option--</option>
  <option value="dog">Dog</option>
  <option value="cat">Cat</option>
  <option value="hamster">Hamster</option>
  <option value="parrot">Parrot</option>
  <option value="spider">Spider</option>
  <option value="goldfish">Goldfish</option>
</select>


<div>
  <input type="radio" id="huey" name="drone" value="huey" checked>
  <label for="huey">Huey</label>
</div>
<div>
  <input type="radio" id="dewey" name="drone" value="dewey">
  <label for="dewey">Dewey</label>
</div>
<div>
  <input type="radio" id="louie" name="drone" value="louie">
  <label for="louie">Louie</label>
</div>


<div>
  <input type="checkbox" id="scales" name="scales" checked>
  <label for="scales">Scales</label>
</div>
<div>
  <input type="checkbox" id="horns" name="horns">
  <label for="horns">Horns</label>
</div>


<input id="date" type="date" value="2017-06-01">


<input type="file" id="avatar" name="avatar" accept="image/png, image/jpeg">


<div>
  <input type="range" id="volume" name="volume" min="0" max="11">
  <label for="volume">Volume</label>
</div>
<div>
  <input type="range" id="cowbell" name="cowbell" min="0" max="100" value="90" step="10">
  <label for="cowbell">Cowbell</label>
</div>


<style>
  ul li { list-style-type: circle; }
  ul li li { list-style-type: square; }
</style>
<ul>
  <li>Milk</li>
  <li>Cheese
    <ul>
      <li>Blue cheese</li>
      <li>Feta</li>
    </ul>
  </li>
</ul>


<ol>
  <li>Mix flour, baking powder, sugar, and salt.</li>
  <li>In another bowl, mix eggs, milk, and oil.</li>
  <li>Stir both mixtures together.</li>
  <li>Fill muffin tray 3/4 full.</li>
  <li>Bake for 20 minutes.</li>
</ol>


${
  HTML_TAG_NAME_LIST
    .map((tagName) => `<fieldset><legend>${tagName}</legend>${HTML_VOID_TAG_NAME_LIST.includes(tagName) ? `<${tagName} />` : `<${tagName}>${tagName}</${tagName}>`}</fieldset>`)
    .join('\n')
}
`)
