import { MarkdownPipe } from './markdown.pipe';

describe('MarkdownPipe', () => {
  const pipe = new MarkdownPipe();

  it('should format bold text and line breaks', () => {
    expect(pipe.transform('**Bold**\nnext line')).toBe('<strong>Bold</strong><br />next line');
  });

  it('should escape HTML before formatting', () => {
    expect(pipe.transform('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
  });

  it('should format inline code', () => {
    expect(pipe.transform('Run `npm start`')).toBe('Run <code>npm start</code>');
  });
});
