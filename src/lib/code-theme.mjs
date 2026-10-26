// Shiki theme for code blocks in notes, using the colours from the Note design.
export default {
  name: 'lens',
  type: 'dark',
  colors: { 'editor.background': '#00000000', 'editor.foreground': '#eeebe4' },
  tokenColors: [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#8a867e', fontStyle: 'italic' } },
    { scope: ['string', 'punctuation.definition.string'], settings: { foreground: '#9fd3b4' } },
    { scope: ['variable', 'punctuation.definition.variable', 'entity.name.type', 'support.type', 'entity.name.class', 'entity.other.attribute-name', 'support.type.property-name'], settings: { foreground: '#e7c98d' } },
    { scope: ['keyword', 'storage', 'entity.name.function', 'support.function', 'entity.name.command', 'entity.name.tag'], settings: { foreground: '#6e95ff' } },
    { scope: ['constant.other.option', 'constant.numeric', 'constant.language', 'variable.parameter'], settings: { foreground: '#b3afa6' } },
    { scope: ['punctuation', 'keyword.operator', 'meta.brace'], settings: { foreground: '#8a867e' } },
  ],
};
