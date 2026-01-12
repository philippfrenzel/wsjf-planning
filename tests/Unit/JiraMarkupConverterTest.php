<?php

namespace Tests\Unit;

use App\Services\JiraMarkupConverter;
use PHPUnit\Framework\TestCase;

class JiraMarkupConverterTest extends TestCase
{
    protected JiraMarkupConverter $converter;

    protected function setUp(): void
    {
        parent::setUp();
        $this->converter = new JiraMarkupConverter();
    }

    public function test_converts_null_and_empty_strings(): void
    {
        $this->assertNull($this->converter->convertToHtml(null));
        $this->assertEquals('', $this->converter->convertToHtml(''));
        $this->assertEquals('   ', $this->converter->convertToHtml('   '));
    }

    public function test_converts_headers(): void
    {
        $jira = "h1. Header 1\nh2. Header 2\nh3. Header 3";
        $html = $this->converter->convertToHtml($jira);
        
        $this->assertStringContainsString('<h1>Header 1</h1>', $html);
        $this->assertStringContainsString('<h2>Header 2</h2>', $html);
        $this->assertStringContainsString('<h3>Header 3</h3>', $html);
    }

    public function test_converts_bold_text(): void
    {
        $jira = "*Als* Platform Owner **möchte ich** etwas";
        $html = $this->converter->convertToHtml($jira);
        
        $this->assertStringContainsString('<strong>Als</strong>', $html);
        $this->assertStringContainsString('<strong>möchte ich</strong>', $html);
    }

    public function test_converts_italic_text(): void
    {
        $jira = "_italic text_";
        $html = $this->converter->convertToHtml($jira);
        
        $this->assertStringContainsString('<em>italic text</em>', $html);
    }

    public function test_converts_links(): void
    {
        $jira = "[https://confluence.swica.ch/x/uxhyDw]";
        $html = $this->converter->convertToHtml($jira);
        
        $this->assertStringContainsString('<a href="https://confluence.swica.ch/x/uxhyDw">https://confluence.swica.ch/x/uxhyDw</a>', $html);
    }

    public function test_converts_links_with_text(): void
    {
        $jira = "[Confluence Link|https://confluence.swica.ch/x/uxhyDw]";
        $html = $this->converter->convertToHtml($jira);
        
        $this->assertStringContainsString('<a href="https://confluence.swica.ch/x/uxhyDw">Confluence Link</a>', $html);
    }

    public function test_converts_unordered_lists(): void
    {
        $jira = "* item 1\n* item 2\n* item 3";
        $html = $this->converter->convertToHtml($jira);
        
        $this->assertStringContainsString('<ul>', $html);
        $this->assertStringContainsString('<li>item 1</li>', $html);
        $this->assertStringContainsString('<li>item 2</li>', $html);
        $this->assertStringContainsString('</ul>', $html);
    }

    public function test_converts_ordered_lists(): void
    {
        $jira = "# first item\n# second item\n# third item";
        $html = $this->converter->convertToHtml($jira);
        
        $this->assertStringContainsString('<ol>', $html);
        $this->assertStringContainsString('<li>first item</li>', $html);
        $this->assertStringContainsString('<li>second item</li>', $html);
        $this->assertStringContainsString('</ol>', $html);
    }

    public function test_converts_code_blocks(): void
    {
        $jira = "{code}some code here{code}";
        $html = $this->converter->convertToHtml($jira);
        
        $this->assertStringContainsString('<pre><code>', $html);
        $this->assertStringContainsString('</code></pre>', $html);
        $this->assertStringContainsString('some code here', $html);
    }

    public function test_converts_inline_code(): void
    {
        $jira = "This is {{inline code}} text";
        $html = $this->converter->convertToHtml($jira);
        
        $this->assertStringContainsString('<code>inline code</code>', $html);
    }

    public function test_converts_blockquotes(): void
    {
        $jira = "bq. This is a quote";
        $html = $this->converter->convertToHtml($jira);
        
        $this->assertStringContainsString('<blockquote>This is a quote</blockquote>', $html);
    }

    public function test_converts_complex_jira_markup(): void
    {
        $jira = "*Als* Platform Owner\n\n*möchte ich* das Kopieren von Draft nach Live der Data Assets eines Datenproduktes korrekt umsetzen\n\n*damit* die Anforderungen der diversen Gruppen (Fach, Compliance ...) berücksichtigt sind.\nh3. Bemerkungen\n\nDokumentation Fachliche Anforderung für Data Assets eines Datenproduktes von Draft nach Live kopieren:\n\n[https://confluence.swica.ch/x/uxhyDw]\nh3. Akzeptanz Kriterien\n * technisches Umsetzungskonzept wurde erstellt und ist dokumentiert als Confluenceseite\n * Folgeticket für Realisierung ist erstellt\n\n+*Reviewer:*+";
        
        $html = $this->converter->convertToHtml($jira);
        
        // Check for bold text
        $this->assertStringContainsString('<strong>Als</strong>', $html);
        $this->assertStringContainsString('<strong>möchte ich</strong>', $html);
        $this->assertStringContainsString('<strong>damit</strong>', $html);
        
        // Check for headers
        $this->assertStringContainsString('<h3>Bemerkungen</h3>', $html);
        $this->assertStringContainsString('<h3>Akzeptanz Kriterien</h3>', $html);
        
        // Check for links
        $this->assertStringContainsString('<a href="https://confluence.swica.ch/x/uxhyDw">', $html);
        
        // Check for list items
        $this->assertStringContainsString('<ul>', $html);
        $this->assertStringContainsString('<li>technisches Umsetzungskonzept', $html);
        $this->assertStringContainsString('<li>Folgeticket für Realisierung', $html);
    }

    public function test_converts_strikethrough(): void
    {
        $jira = "-strikethrough text-";
        $html = $this->converter->convertToHtml($jira);
        
        $this->assertStringContainsString('<del>strikethrough text</del>', $html);
    }

    public function test_converts_underline(): void
    {
        $jira = "+underlined text+";
        $html = $this->converter->convertToHtml($jira);
        
        $this->assertStringContainsString('<u>underlined text</u>', $html);
    }

    public function test_preserves_plain_text(): void
    {
        $jira = "This is plain text without any markup.";
        $html = $this->converter->convertToHtml($jira);
        
        $this->assertStringContainsString('This is plain text without any markup.', $html);
    }
}
