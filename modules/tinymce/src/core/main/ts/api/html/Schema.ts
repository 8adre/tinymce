/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import { Obj } from '@ephox/katamari';
import Tools from '../util/Tools';

export type SchemaType = 'html4' | 'html5' | 'html5-strict';

export interface SchemaSettings {
  block_elements?: string;
  boolean_attributes?: string;
  custom_elements?: string;
  extended_valid_elements?: string;
  invalid_elements?: string;
  invalid_styles?: string | Record<string, string>;
  move_caret_before_on_enter_elements?: string;
  non_empty_elements?: string;
  schema?: SchemaType;
  self_closing_elements?: string;
  short_ended_elements?: string;
  special?: string;
  text_block_elements?: string;
  text_inline_elements?: string;
  valid_children?: string;
  valid_classes?: string | Record<string, string>;
  valid_elements?: string;
  valid_styles?: string | Record<string, string>;
  verify_html?: boolean;
  whitespace_elements?: string;
}

export interface Attribute {
  required?: boolean;
  defaultValue?: string;
  forcedValue?: string;
  validValues?: any;
}

export interface DefaultAttribute {
  name: string;
  value: string;
}

export interface AttributePattern {
  defaultValue?: string;
  forcedValue?: string;
  pattern: RegExp;
  required?: boolean;
  validValues?: Record<string, string>;
}

export interface ElementRule {
  attributes: Record<string, Attribute>;
  attributesDefault?: DefaultAttribute[];
  attributesForced?: DefaultAttribute[];
  attributesOrder: string[];
  attributePatterns?: AttributePattern[];
  attributesRequired?: string[];
  paddEmpty?: boolean;
  removeEmpty?: boolean;
  removeEmptyAttrs?: boolean;
}

export interface SchemaElement extends ElementRule {
  outputName?: string;
  parentsRequired?: string[];
  pattern?: RegExp;
}

export interface SchemaMap { [name: string]: {} }
export interface SchemaRegExpMap { [name: string]: RegExp }

interface Schema {
  children: Record<string, {}>;
  elements: Record<string, SchemaElement>;
  getValidStyles (): SchemaMap;
  getValidClasses (): SchemaMap;
  getBlockElements (): SchemaMap;
  getInvalidStyles (): SchemaMap;
  getShortEndedElements (): SchemaMap;
  getTextBlockElements (): SchemaMap;
  getTextInlineElements (): SchemaMap;
  getBoolAttrs (): SchemaMap;
  getElementRule (name: string): SchemaElement;
  getSelfClosingElements (): SchemaMap;
  getNonEmptyElements (): SchemaMap;
  getMoveCaretBeforeOnEnterElements (): SchemaMap;
  getWhiteSpaceElements (): SchemaMap;
  getSpecialElements (): SchemaRegExpMap;
  isValidChild (name: string, child: string): boolean;
  isValid (name: string, attr?: string): boolean;
  getCustomElements (): SchemaMap;
  addValidElements (validElements: string): void;
  setValidElements (validElements: string): void;
  addCustomElements (customElements: string): void;
  addValidChildren (validChildren: any): void;
}

/**
 * Schema validator class.
 *
 * @class tinymce.html.Schema
 * @example
 *  if (tinymce.activeEditor.schema.isValidChild('p', 'span'))
 *    alert('span is valid child of p.');
 *
 *  if (tinymce.activeEditor.schema.getElementRule('p'))
 *    alert('P is a valid element.');
 *
 * @class tinymce.html.Schema
 * @version 3.4
 */

const mapCache: any = {}, dummyObj = {};
const makeMap = Tools.makeMap, each = Tools.each, extend = Tools.extend, explode = Tools.explode, inArray = Tools.inArray;

const split = (items: string, delim?: string): string[] => {
  items = Tools.trim(items);
  return items ? items.split(delim || ' ') : [];
};

/**
 * Builds a schema lookup table
 *
 * @private
 * @param {String} type html4, html5 or html5-strict schema type.
 * @return {Object} Schema lookup table.
 */
// TODO: Improve return type
const compileSchema = (type: SchemaType): Record<string, any> => {
  const schema: Record<string, any> = {};
  let globalAttributes, blockContent;
  let phrasingContent, flowContent, html4BlockContent, html4PhrasingContent;

  const add = (name: string, attributes?: string, children?: string | string[]) => {
    let ni, attributesOrder, element;

    const arrayToMap = (array, obj?) => {
      const map = {};
      let i, l;

      for (i = 0, l = array.length; i < l; i++) {
        map[array[i]] = obj || {};
      }

      return map;
    };

    children = children || [];
    attributes = attributes || '';

    if (typeof children === 'string') {
      children = split(children);
    }

    const names = split(name);
    ni = names.length;
    while (ni--) {
      attributesOrder = split([ globalAttributes, attributes ].join(' '));

      element = {
        attributes: arrayToMap(attributesOrder),
        attributesOrder,
        children: arrayToMap(children, dummyObj)
      };

      schema[names[ni]] = element;
    }
  };

  const addAttrs = (name: string, attributes?: string) => {
    let ni, schemaItem, i, l;

    const names = split(name);
    ni = names.length;
    const attrs = split(attributes);
    while (ni--) {
      schemaItem = schema[names[ni]];
      for (i = 0, l = attrs.length; i < l; i++) {
        schemaItem.attributes[attrs[i]] = {};
        schemaItem.attributesOrder.push(attrs[i]);
      }
    }
  };

  // Use cached schema
  if (mapCache[type]) {
    return mapCache[type];
  }

  // Attributes present on all elements
  globalAttributes = 'id accesskey class dir lang style tabindex title role';

  // Event attributes can be opt-in/opt-out
  /* eventAttributes = split("onabort onblur oncancel oncanplay oncanplaythrough onchange onclick onclose oncontextmenu oncuechange " +
   "ondblclick ondrag ondragend ondragenter ondragleave ondragover ondragstart ondrop ondurationchange onemptied onended " +
   "onerror onfocus oninput oninvalid onkeydown onkeypress onkeyup onload onloadeddata onloadedmetadata onloadstart " +
   "onmousedown onmousemove onmouseout onmouseover onmouseup onmousewheel onpause onplay onplaying onprogress onratechange " +
   "onreset onscroll onseeked onseeking onseeking onselect onshow onstalled onsubmit onsuspend ontimeupdate onvolumechange " +
   "onwaiting"
   );*/

  // Block content elements
  blockContent =
    'address blockquote div dl fieldset form h1 h2 h3 h4 h5 h6 hr menu ol p pre table ul';

  // Phrasing content elements from the HTML5 spec (inline)
  phrasingContent =
    'a abbr b bdo br button cite code del dfn em embed i iframe img input ins kbd ' +
    'label map noscript object q s samp script select small span strong sub sup ' +
    'textarea u var #text #comment';

  // Add HTML5 items to globalAttributes, blockContent, phrasingContent
  if (type !== 'html4') {
    globalAttributes += ' contenteditable contextmenu draggable dropzone ' +
      'hidden spellcheck translate';
    blockContent += ' article aside details dialog figure main header footer hgroup section nav';
    phrasingContent += ' audio canvas command datalist mark meter output picture ' +
      'progress time wbr video ruby bdi keygen';
  }

  // Add HTML4 elements unless it's html5-strict
  if (type !== 'html5-strict') {
    globalAttributes += ' xml:lang';

    html4PhrasingContent = 'acronym applet basefont big font strike tt';
    phrasingContent = [ phrasingContent, html4PhrasingContent ].join(' ');

    each(split(html4PhrasingContent), (name) => {
      add(name, '', phrasingContent);
    });

    html4BlockContent = 'center dir isindex noframes';
    blockContent = [ blockContent, html4BlockContent ].join(' ');

    // Flow content elements from the HTML5 spec (block+inline)
    flowContent = [ blockContent, phrasingContent ].join(' ');

    each(split(html4BlockContent), (name) => {
      add(name, '', flowContent);
    });
  }

  // Flow content elements from the HTML5 spec (block+inline)
  flowContent = flowContent || [ blockContent, phrasingContent ].join(' ');

  // HTML4 base schema TODO: Move HTML5 specific attributes to HTML5 specific if statement
  // Schema items <element name>, <specific attributes>, <children ..>
  add('html', 'manifest', 'head body');
  add('head', '', 'base command link meta noscript script style title');
  add('title hr noscript br');
  add('base', 'href target');
  add('link', 'href rel media hreflang type sizes hreflang');
  add('meta', 'name http-equiv content charset');
  add('style', 'media type scoped');
  add('script', 'src async defer type charset');
  add('body', 'onafterprint onbeforeprint onbeforeunload onblur onerror onfocus ' +
    'onhashchange onload onmessage onoffline ononline onpagehide onpageshow ' +
    'onpopstate onresize onscroll onstorage onunload', flowContent);
  add('address dt dd div caption', '', flowContent);
  add('h1 h2 h3 h4 h5 h6 pre p abbr code var samp kbd sub sup i b u bdo span legend em strong small s cite dfn', '', phrasingContent);
  add('blockquote', 'cite', flowContent);
  add('ol', 'reversed start type', 'li');
  add('ul', '', 'li');
  add('li', 'value', flowContent);
  add('dl', '', 'dt dd');
  add('a', 'href target rel media hreflang type', phrasingContent);
  add('q', 'cite', phrasingContent);
  add('ins del', 'cite datetime', flowContent);
  add('img', 'src sizes srcset alt usemap ismap width height');
  add('iframe', 'src name width height', flowContent);
  add('embed', 'src type width height');
  add('object', 'data type typemustmatch name usemap form width height', [ flowContent, 'param' ].join(' '));
  add('param', 'name value');
  add('map', 'name', [ flowContent, 'area' ].join(' '));
  add('area', 'alt coords shape href target rel media hreflang type');
  add('table', 'border', 'caption colgroup thead tfoot tbody tr' + (type === 'html4' ? ' col' : ''));
  add('colgroup', 'span', 'col');
  add('col', 'span');
  add('tbody thead tfoot', '', 'tr');
  add('tr', '', 'td th');
  add('td', 'colspan rowspan headers', flowContent);
  add('th', 'colspan rowspan headers scope abbr', flowContent);
  add('form', 'accept-charset action autocomplete enctype method name novalidate target', flowContent);
  add('fieldset', 'disabled form name', [ flowContent, 'legend' ].join(' '));
  add('label', 'form for', phrasingContent);
  add('input', 'accept alt autocomplete checked dirname disabled form formaction formenctype formmethod formnovalidate ' +
    'formtarget height list max maxlength min multiple name pattern readonly required size src step type value width'
  );
  add('button', 'disabled form formaction formenctype formmethod formnovalidate formtarget name type value',
    type === 'html4' ? flowContent : phrasingContent);
  add('select', 'disabled form multiple name required size', 'option optgroup');
  add('optgroup', 'disabled label', 'option');
  add('option', 'disabled label selected value');
  add('textarea', 'cols dirname disabled form maxlength name readonly required rows wrap');
  add('menu', 'type label', [ flowContent, 'li' ].join(' '));
  add('noscript', '', flowContent);

  // Extend with HTML5 elements
  if (type !== 'html4') {
    add('wbr');
    add('ruby', '', [ phrasingContent, 'rt rp' ].join(' '));
    add('figcaption', '', flowContent);
    add('mark rt rp summary bdi', '', phrasingContent);
    add('canvas', 'width height', flowContent);
    add('video', 'src crossorigin poster preload autoplay mediagroup loop ' +
      'muted controls width height buffered', [ flowContent, 'track source' ].join(' '));
    add('audio', 'src crossorigin preload autoplay mediagroup loop muted controls ' +
      'buffered volume', [ flowContent, 'track source' ].join(' '));
    add('picture', '', 'img source');
    add('source', 'src srcset type media sizes');
    add('track', 'kind src srclang label default');
    add('datalist', '', [ phrasingContent, 'option' ].join(' '));
    add('article section nav aside main header footer', '', flowContent);
    add('hgroup', '', 'h1 h2 h3 h4 h5 h6');
    add('figure', '', [ flowContent, 'figcaption' ].join(' '));
    add('time', 'datetime', phrasingContent);
    add('dialog', 'open', flowContent);
    add('command', 'type label icon disabled checked radiogroup command');
    add('output', 'for form name', phrasingContent);
    add('progress', 'value max', phrasingContent);
    add('meter', 'value min max low high optimum', phrasingContent);
    add('details', 'open', [ flowContent, 'summary' ].join(' '));
    add('keygen', 'autofocus challenge disabled form keytype name');
  }

  // Extend with HTML4 attributes unless it's html5-strict
  if (type !== 'html5-strict') {
    addAttrs('script', 'language xml:space');
    addAttrs('style', 'xml:space');
    addAttrs('object', 'declare classid code codebase codetype archive standby align border hspace vspace');
    addAttrs('embed', 'align name hspace vspace');
    addAttrs('param', 'valuetype type');
    addAttrs('a', 'charset name rev shape coords');
    addAttrs('br', 'clear');
    addAttrs('applet', 'codebase archive code object alt name width height align hspace vspace');
    addAttrs('img', 'name longdesc align border hspace vspace');
    addAttrs('iframe', 'longdesc frameborder marginwidth marginheight scrolling align');
    addAttrs('font basefont', 'size color face');
    addAttrs('input', 'usemap align');
    addAttrs('select');
    addAttrs('textarea');
    addAttrs('h1 h2 h3 h4 h5 h6 div p legend caption', 'align');
    addAttrs('ul', 'type compact');
    addAttrs('li', 'type');
    addAttrs('ol dl menu dir', 'compact');
    addAttrs('pre', 'width xml:space');
    addAttrs('hr', 'align noshade size width');
    addAttrs('isindex', 'prompt');
    addAttrs('table', 'summary width frame rules cellspacing cellpadding align bgcolor');
    addAttrs('col', 'width align char charoff valign');
    addAttrs('colgroup', 'width align char charoff valign');
    addAttrs('thead', 'align char charoff valign');
    addAttrs('tr', 'align char charoff valign bgcolor');
    addAttrs('th', 'axis align char charoff valign nowrap bgcolor width height');
    addAttrs('form', 'accept');
    addAttrs('td', 'abbr axis scope align char charoff valign nowrap bgcolor width height');
    addAttrs('tfoot', 'align char charoff valign');
    addAttrs('tbody', 'align char charoff valign');
    addAttrs('area', 'nohref');
    addAttrs('body', 'background bgcolor text link vlink alink');
  }

  // Extend with HTML5 attributes unless it's html4
  if (type !== 'html4') {
    addAttrs('input button select textarea', 'autofocus');
    addAttrs('input textarea', 'placeholder');
    addAttrs('a', 'download');
    addAttrs('link script img', 'crossorigin');
    addAttrs('img', 'loading');
    addAttrs('iframe', 'sandbox seamless allowfullscreen loading'); // Excluded: srcdoc
  }

  // Special: iframe, ruby, video, audio, label

  // Delete children of the same name from it's parent
  // For example: form can't have a child of the name form
  each(split('a form meter progress dfn'), (name) => {
    if (schema[name]) {
      delete schema[name].children[name];
    }
  });

  // Delete header, footer, sectioning and heading content descendants
  /* each('dt th address', function(name) {
   delete schema[name].children[name];
   });*/

  // Caption can't have tables
  delete schema.caption.children.table;

  // Delete scripts by default due to possible XSS
  delete schema.script;

  // TODO: LI:s can only have value if parent is OL

  // TODO: Handle transparent elements
  // a ins del canvas map

  mapCache[type] = schema;

  return schema;
};

const compileElementMap = (value: string | Record<string, string>, mode?: string ) => {
  let styles;

  if (value) {
    styles = {};

    if (typeof value === 'string') {
      value = {
        '*': value
      };
    }

    // Convert styles into a rule list
    each(value, (value, key) => {
      styles[key] = styles[key.toUpperCase()] = mode === 'map' ? makeMap(value, /[, ]/) : explode(value, /[, ]/);
    });
  }

  return styles;
};

const Schema = (settings?: SchemaSettings): Schema => {
  let elements: Record<string, SchemaElement> = {};
  const children: Record<string, {}> = {};
  let patternElements = [];
  const customElementsMap = {}, specialElements = {} as SchemaRegExpMap;

  // Creates an lookup table map object for the specified option or the default value
  const createLookupTable = (option: string, defaultValue?: string, extendWith?: string) => {
    let value = settings[option];

    if (!value) {
      // Get cached default map or make it if needed
      value = mapCache[option];

      if (!value) {
        value = makeMap(defaultValue, ' ', makeMap(defaultValue.toUpperCase(), ' '));
        value = extend(value, extendWith);

        mapCache[option] = value;
      }
    } else {
      // Create custom map
      value = makeMap(value, /[, ]/, makeMap(value.toUpperCase(), /[, ]/));
    }

    return value;
  };

  settings = settings || {};
  const schemaItems = compileSchema(settings.schema);

  // Allow all elements and attributes if verify_html is set to false
  if (settings.verify_html === false) {
    settings.valid_elements = '*[*]';
  }

  const validStyles = compileElementMap(settings.valid_styles);
  const invalidStyles = compileElementMap(settings.invalid_styles, 'map');
  const validClasses = compileElementMap(settings.valid_classes, 'map');

  // Setup map objects
  const whiteSpaceElementsMap = createLookupTable(
    'whitespace_elements',
    'pre script noscript style textarea video audio iframe object code'
  );
  const selfClosingElementsMap = createLookupTable('self_closing_elements', 'colgroup dd dt li option p td tfoot th thead tr');
  const shortEndedElementsMap = createLookupTable('short_ended_elements', 'area base basefont br col frame hr img input isindex link ' +
    'meta param embed source wbr track');
  const boolAttrMap = createLookupTable('boolean_attributes', 'checked compact declare defer disabled ismap multiple nohref noresize ' +
    'noshade nowrap readonly selected autoplay loop controls');

  const nonEmptyOrMoveCaretBeforeOnEnter = 'td th iframe video audio object script code';
  const nonEmptyElementsMap = createLookupTable('non_empty_elements', nonEmptyOrMoveCaretBeforeOnEnter + ' pre', shortEndedElementsMap);
  const moveCaretBeforeOnEnterElementsMap = createLookupTable('move_caret_before_on_enter_elements', nonEmptyOrMoveCaretBeforeOnEnter + ' table', shortEndedElementsMap);

  const textBlockElementsMap = createLookupTable('text_block_elements', 'h1 h2 h3 h4 h5 h6 p div address pre form ' +
    'blockquote center dir fieldset header footer article section hgroup aside main nav figure');
  const blockElementsMap = createLookupTable('block_elements', 'hr table tbody thead tfoot ' +
    'th tr td li ol ul caption dl dt dd noscript menu isindex option ' +
    'datalist select optgroup figcaption details summary', textBlockElementsMap);
  const textInlineElementsMap = createLookupTable('text_inline_elements', 'span strong b em i font strike u var cite ' +
    'dfn code mark q sup sub samp');

  each((settings.special || 'script noscript iframe noframes noembed title style textarea xmp').split(' '), (name) => {
    specialElements[name] = new RegExp('<\/' + name + '[^>]*>', 'gi');
  });

  // Converts a wildcard expression string to a regexp for example *a will become /.*a/.
  const patternToRegExp = (str) => new RegExp('^' + str.replace(/([?+*])/g, '.$1') + '$');

  // Parses the specified valid_elements string and adds to the current rules
  // This function is a bit hard to read since it's heavily optimized for speed
  const addValidElements = (validElements: string) => {
    let ei, el, ai, al, matches, element, attr, attrData, elementName, attrName, attrType, attributes, attributesOrder,
      prefix, outputName, globalAttributes, globalAttributesOrder, value;
    const elementRuleRegExp = /^([#+\-])?([^\[!\/]+)(?:\/([^\[!]+))?(?:(!?)\[([^\]]+)])?$/,
      attrRuleRegExp = /^([!\-])?(\w+[\\:]:\w+|[^=:<]+)?(?:([=:<])(.*))?$/,
      hasPatternsRegExp = /[*?+]/;

    if (validElements) {
      // Split valid elements into an array with rules
      const validElementsArr = split(validElements, ',');

      if (elements['@']) {
        globalAttributes = elements['@'].attributes;
        globalAttributesOrder = elements['@'].attributesOrder;
      }

      // Loop all rules
      for (ei = 0, el = validElementsArr.length; ei < el; ei++) {
        // Parse element rule
        matches = elementRuleRegExp.exec(validElementsArr[ei]);
        if (matches) {
          // Setup local names for matches
          prefix = matches[1];
          elementName = matches[2];
          outputName = matches[3];
          attrData = matches[5];

          // Create new attributes and attributesOrder
          attributes = {};
          attributesOrder = [];

          // Create the new element
          element = {
            attributes,
            attributesOrder
          };

          // Padd empty elements prefix
          if (prefix === '#') {
            element.paddEmpty = true;
          }

          // Remove empty elements prefix
          if (prefix === '-') {
            element.removeEmpty = true;
          }

          if (matches[4] === '!') {
            element.removeEmptyAttrs = true;
          }

          // Copy attributes from global rule into current rule
          if (globalAttributes) {
            Obj.each(globalAttributes, (value, key) => {
              attributes[key] = value;
            });

            attributesOrder.push.apply(attributesOrder, globalAttributesOrder);
          }

          // Attributes defined
          if (attrData) {
            attrData = split(attrData, '|');
            for (ai = 0, al = attrData.length; ai < al; ai++) {
              matches = attrRuleRegExp.exec(attrData[ai]);
              if (matches) {
                attr = {};
                attrType = matches[1];
                attrName = matches[2].replace(/[\\:]:/g, ':');
                prefix = matches[3];
                value = matches[4];

                // Required
                if (attrType === '!') {
                  element.attributesRequired = element.attributesRequired || [];
                  element.attributesRequired.push(attrName);
                  attr.required = true;
                }

                // Denied from global
                if (attrType === '-') {
                  delete attributes[attrName];
                  attributesOrder.splice(inArray(attributesOrder, attrName), 1);
                  continue;
                }

                // Default value
                if (prefix) {
                  // Default value
                  if (prefix === '=') {
                    element.attributesDefault = element.attributesDefault || [];
                    element.attributesDefault.push({ name: attrName, value });
                    attr.defaultValue = value;
                  }

                  // Forced value
                  if (prefix === ':') {
                    element.attributesForced = element.attributesForced || [];
                    element.attributesForced.push({ name: attrName, value });
                    attr.forcedValue = value;
                  }

                  // Required values
                  if (prefix === '<') {
                    attr.validValues = makeMap(value, '?');
                  }
                }

                // Check for attribute patterns
                if (hasPatternsRegExp.test(attrName)) {
                  element.attributePatterns = element.attributePatterns || [];
                  attr.pattern = patternToRegExp(attrName);
                  element.attributePatterns.push(attr);
                } else {
                  // Add attribute to order list if it doesn't already exist
                  if (!attributes[attrName]) {
                    attributesOrder.push(attrName);
                  }

                  attributes[attrName] = attr;
                }
              }
            }
          }

          // Global rule, store away these for later usage
          if (!globalAttributes && elementName === '@') {
            globalAttributes = attributes;
            globalAttributesOrder = attributesOrder;
          }

          // Handle substitute elements such as b/strong
          if (outputName) {
            element.outputName = elementName;
            elements[outputName] = element;
          }

          // Add pattern or exact element
          if (hasPatternsRegExp.test(elementName)) {
            element.pattern = patternToRegExp(elementName);
            patternElements.push(element);
          } else {
            elements[elementName] = element;
          }
        }
      }
    }
  };

  const setValidElements = (validElements: string) => {
    elements = {};
    patternElements = [];

    addValidElements(validElements);

    each(schemaItems, (element, name) => {
      children[name] = element.children;
    });
  };

  // Adds custom non HTML elements to the schema
  const addCustomElements = (customElements: string) => {
    const customElementRegExp = /^(~)?(.+)$/;

    if (customElements) {
      // Flush cached items since we are altering the default maps
      mapCache.text_block_elements = mapCache.block_elements = null;

      each(split(customElements, ','), (rule) => {
        const matches = customElementRegExp.exec(rule),
          inline = matches[1] === '~',
          cloneName = inline ? 'span' : 'div',
          name = matches[2];

        children[name] = children[cloneName];
        customElementsMap[name] = cloneName;

        // If it's not marked as inline then add it to valid block elements
        if (!inline) {
          blockElementsMap[name.toUpperCase()] = {};
          blockElementsMap[name] = {};
        }

        // Add elements clone if needed
        if (!elements[name]) {
          let customRule = elements[cloneName];

          customRule = extend({}, customRule);
          delete customRule.removeEmptyAttrs;
          delete customRule.removeEmpty;

          elements[name] = customRule;
        }

        // Add custom elements at span/div positions
        each(children, (element, elmName) => {
          if (element[cloneName]) {
            children[elmName] = element = extend({}, children[elmName]);
            element[name] = element[cloneName];
          }
        });
      });
    }
  };

  // Adds valid children to the schema object
  const addValidChildren = (validChildren) => {
    // see: https://html.spec.whatwg.org/#valid-custom-element-name
    const childRuleRegExp = /^([+\-]?)([A-Za-z0-9_\-.\u00b7\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u037d\u037f-\u1fff\u200c-\u200d\u203f-\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]+)\[([^\]]+)]$/; // from w3c's custom grammar (above)

    // Invalidate the schema cache if the schema is mutated
    mapCache[settings.schema] = null;

    if (validChildren) {
      each(split(validChildren, ','), (rule) => {
        const matches = childRuleRegExp.exec(rule);
        let parent, prefix;

        if (matches) {
          prefix = matches[1];

          // Add/remove items from default
          if (prefix) {
            parent = children[matches[2]];
          } else {
            parent = children[matches[2]] = { '#comment': {}};
          }

          parent = children[matches[2]];

          each(split(matches[3], '|'), (child) => {
            if (prefix === '-') {
              delete parent[child];
            } else {
              parent[child] = {};
            }
          });
        }
      });
    }
  };

  const getElementRule = (name: string): ElementRule => {
    let element = elements[name], i;

    // Exact match found
    if (element) {
      return element;
    }

    // No exact match then try the patterns
    i = patternElements.length;
    while (i--) {
      element = patternElements[i];

      if (element.pattern.test(name)) {
        return element;
      }
    }
  };

  if (!settings.valid_elements) {
    // No valid elements defined then clone the elements from the schema spec
    each(schemaItems, (element, name) => {
      elements[name] = {
        attributes: element.attributes,
        attributesOrder: element.attributesOrder
      };

      children[name] = element.children;
    });

    // Switch these on HTML4
    if (settings.schema !== 'html5') {
      each(split('strong/b em/i'), (item) => {
        const items = split(item, '/');
        elements[items[1]].outputName = items[0];
      });
    }

    // Add default alt attribute for images, removed since alt="" is treated as presentational.
    // elements.img.attributesDefault = [{name: 'alt', value: ''}];

    // Remove these if they are empty by default
    each(split('ol ul sub sup blockquote span font a table tbody strong em b i'), (name) => {
      if (elements[name]) {
        elements[name].removeEmpty = true;
      }
    });

    // Padd these by default
    each(split('p h1 h2 h3 h4 h5 h6 th td pre div address caption li'), (name) => {
      elements[name].paddEmpty = true;
    });

    // Remove these if they have no attributes
    each(split('span'), (name) => {
      elements[name].removeEmptyAttrs = true;
    });

    // Remove these by default
    // TODO: Reenable in 4.1
    /* each(split('script style'), function(name) {
     delete elements[name];
     });*/
  } else {
    setValidElements(settings.valid_elements);
  }

  addCustomElements(settings.custom_elements);
  addValidChildren(settings.valid_children);
  addValidElements(settings.extended_valid_elements);

  // Todo: Remove this when we fix list handling to be valid
  addValidChildren('+ol[ul|ol],+ul[ul|ol]');

  // Some elements are not valid by themselves - require parents
  each({
    dd: 'dl',
    dt: 'dl',
    li: 'ul ol',
    td: 'tr',
    th: 'tr',
    tr: 'tbody thead tfoot',
    tbody: 'table',
    thead: 'table',
    tfoot: 'table',
    legend: 'fieldset',
    area: 'map',
    param: 'video audio object'
  }, (parents, item) => {
    if (elements[item]) {
      elements[item].parentsRequired = split(parents);
    }
  });

  // Delete invalid elements
  if (settings.invalid_elements) {
    each(explode(settings.invalid_elements), (item) => {
      if (elements[item]) {
        delete elements[item];
      }
    });
  }

  // If the user didn't allow span only allow internal spans
  if (!getElementRule('span')) {
    addValidElements('span[!data-mce-type|*]');
  }

  /**
   * Name/value map object with valid parents and children to those parents.
   *
   * @example
   * children = {
   *    div:{p:{}, h1:{}}
   * };
   * @field children
   * @type Object
   */

  /**
   * Name/value map object with valid styles for each element.
   *
   * @method getValidStyles
   * @type Object
   */
  const getValidStyles = (): SchemaMap => validStyles;

  /**
   * Name/value map object with valid styles for each element.
   *
   * @method getInvalidStyles
   * @type Object
   */
  const getInvalidStyles = (): SchemaMap => invalidStyles;

  /**
   * Name/value map object with valid classes for each element.
   *
   * @method getValidClasses
   * @type Object
   */
  const getValidClasses = (): SchemaMap => validClasses;

  /**
   * Returns a map with boolean attributes.
   *
   * @method getBoolAttrs
   * @return {Object} Name/value lookup map for boolean attributes.
   */
  const getBoolAttrs = (): SchemaMap => boolAttrMap;

  /**
   * Returns a map with block elements.
   *
   * @method getBlockElements
   * @return {Object} Name/value lookup map for block elements.
   */
  const getBlockElements = (): SchemaMap => blockElementsMap;

  /**
   * Returns a map with text block elements. Such as: p,h1-h6,div,address
   *
   * @method getTextBlockElements
   * @return {Object} Name/value lookup map for block elements.
   */
  const getTextBlockElements = (): SchemaMap => textBlockElementsMap;

  /**
   * Returns a map of inline text format nodes for example strong/span or ins.
   *
   * @method getTextInlineElements
   * @return {Object} Name/value lookup map for text format elements.
   */
  const getTextInlineElements = (): SchemaMap => textInlineElementsMap;

  /**
   * Returns a map with short ended elements such as BR or IMG.
   *
   * @method getShortEndedElements
   * @return {Object} Name/value lookup map for short ended elements.
   */
  const getShortEndedElements = (): SchemaMap => shortEndedElementsMap;

  /**
   * Returns a map with self closing tags such as <li>.
   *
   * @method getSelfClosingElements
   * @return {Object} Name/value lookup map for self closing tags elements.
   */
  const getSelfClosingElements = (): SchemaMap => selfClosingElementsMap;

  /**
   * Returns a map with elements that should be treated as contents regardless if it has text
   * content in them or not such as TD, VIDEO or IMG.
   *
   * @method getNonEmptyElements
   * @return {Object} Name/value lookup map for non empty elements.
   */
  const getNonEmptyElements = (): SchemaMap => nonEmptyElementsMap;

  /**
   * Returns a map with elements that the caret should be moved in front of after enter is
   * pressed
   *
   * @method getMoveCaretBeforeOnEnterElements
   * @return {Object} Name/value lookup map for elements to place the caret in front of.
   */
  const getMoveCaretBeforeOnEnterElements = (): SchemaMap => moveCaretBeforeOnEnterElementsMap;

  /**
   * Returns a map with elements where white space is to be preserved like PRE or SCRIPT.
   *
   * @method getWhiteSpaceElements
   * @return {Object} Name/value lookup map for white space elements.
   */
  const getWhiteSpaceElements = (): SchemaMap => whiteSpaceElementsMap;

  /**
   * Returns a map with special elements. These are elements that needs to be parsed
   * in a special way such as script, style, textarea etc. The map object values
   * are regexps used to find the end of the element.
   *
   * @method getSpecialElements
   * @return {Object} Name/value lookup map for special elements.
   */
  const getSpecialElements = (): SchemaRegExpMap => specialElements;

  /**
   * Returns true/false if the specified element and it's child is valid or not
   * according to the schema.
   *
   * @method isValidChild
   * @param {String} name Element name to check for.
   * @param {String} child Element child to verify.
   * @return {Boolean} True/false if the element is a valid child of the specified parent.
   */
  const isValidChild = (name: string, child: string): boolean => {
    const parent = children[name.toLowerCase()];
    return !!(parent && parent[child.toLowerCase()]);
  };

  /**
   * Returns true/false if the specified element name and optional attribute is
   * valid according to the schema.
   *
   * @method isValid
   * @param {String} name Name of element to check.
   * @param {String} attr Optional attribute name to check for.
   * @return {Boolean} True/false if the element and attribute is valid.
   */
  const isValid = (name: string, attr?: string): boolean => {
    let attrPatterns, i;
    const rule = getElementRule(name);

    // Check if it's a valid element
    if (rule) {
      if (attr) {
        // Check if attribute name exists
        if (rule.attributes[attr]) {
          return true;
        }

        // Check if attribute matches a regexp pattern
        attrPatterns = rule.attributePatterns;
        if (attrPatterns) {
          i = attrPatterns.length;
          while (i--) {
            if (attrPatterns[i].pattern.test(name)) {
              return true;
            }
          }
        }
      } else {
        return true;
      }
    }

    // No match
    return false;
  };

  /**
   * Returns true/false if the specified element is valid or not
   * according to the schema.
   *
   * @method getElementRule
   * @param {String} name Element name to check for.
   * @return {Object} Element object or undefined if the element isn't valid.
   */

  /**
   * Returns an map object of all custom elements.
   *
   * @method getCustomElements
   * @return {Object} Name/value map object of all custom elements.
   */
  const getCustomElements = (): SchemaMap => customElementsMap;

  /**
   * Parses a valid elements string and adds it to the schema. The valid elements
   * format is for example "element[attr=default|otherattr]".
   * Existing rules will be replaced with the ones specified, so this extends the schema.
   *
   * @method addValidElements
   * @param {String} valid_elements String in the valid elements format to be parsed.
   */

  /**
   * Parses a valid elements string and sets it to the schema. The valid elements
   * format is for example "element[attr=default|otherattr]".
   * Existing rules will be replaced with the ones specified, so this extends the schema.
   *
   * @method setValidElements
   * @param {String} valid_elements String in the valid elements format to be parsed.
   */

  /**
   * Adds custom non HTML elements to the schema.
   *
   * @method addCustomElements
   * @param {String} custom_elements Comma separated list of custom elements to add.
   */

  /**
   * Parses a valid children string and adds them to the schema structure. The valid children
   * format is for example: "element[child1|child2]".
   *
   * @method addValidChildren
   * @param {String} valid_children Valid children elements string to parse
   */

  return {
    children,
    elements,
    getValidStyles,
    getValidClasses,
    getBlockElements,
    getInvalidStyles,
    getShortEndedElements,
    getTextBlockElements,
    getTextInlineElements,
    getBoolAttrs,
    getElementRule,
    getSelfClosingElements,
    getNonEmptyElements,
    getMoveCaretBeforeOnEnterElements,
    getWhiteSpaceElements,
    getSpecialElements,
    isValidChild,
    isValid,
    getCustomElements,
    addValidElements,
    setValidElements,
    addCustomElements,
    addValidChildren
  };
};

export default Schema;
