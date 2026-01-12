<?php

namespace App\Services;

class JiraMarkupConverter
{
    /**
     * Convert Jira wiki markup to HTML.
     *
     * @param string|null $markup
     * @return string|null
     */
    public function convertToHtml(?string $markup): ?string
    {
        if ($markup === null || trim($markup) === '') {
            return $markup;
        }

        $html = $markup;

        // Step 1: Convert block-level elements first (order matters)
        // Convert code blocks first to preserve their content
        $html = preg_replace_callback('/\{code(?::([^\}]+))?\}(.*?)\{code\}/s', function($matches) {
            $code = htmlspecialchars($matches[2], ENT_QUOTES, 'UTF-8');
            return '<pre><code>' . $code . '</code></pre>';
        }, $html);

        // Convert headers (h1. through h6.)
        $html = preg_replace('/^h1\.\s+(.+)$/m', '<h1>$1</h1>', $html);
        $html = preg_replace('/^h2\.\s+(.+)$/m', '<h2>$1</h2>', $html);
        $html = preg_replace('/^h3\.\s+(.+)$/m', '<h3>$1</h3>', $html);
        $html = preg_replace('/^h4\.\s+(.+)$/m', '<h4>$1</h4>', $html);
        $html = preg_replace('/^h5\.\s+(.+)$/m', '<h5>$1</h5>', $html);
        $html = preg_replace('/^h6\.\s+(.+)$/m', '<h6>$1</h6>', $html);

        // Convert quote blocks (bq. text)
        $html = preg_replace('/^bq\.\s+(.+)$/m', '<blockquote>$1</blockquote>', $html);

        // Convert tables
        $html = $this->convertTables($html);

        // Convert panels {panel}...{panel}
        $html = preg_replace('/\{panel(?::title=([^\}]+))?\}(.*?)\{panel\}/s', '<div class="panel"><strong>$1</strong>$2</div>', $html);

        // Convert lists (these need special handling to keep them as blocks)
        $html = $this->convertUnorderedLists($html);
        $html = $this->convertOrderedLists($html);

        // Step 2: Convert inline elements
        // Convert bold text (*text* or **text**) - but not list markers
        // Match ** first (it has priority)
        $html = preg_replace('/\*\*([^\*]+)\*\*/', '<strong>$1</strong>', $html);
        // Match single * but NOT when followed by space (list marker) or at start of line followed by space
        $html = preg_replace('/\*(?! )([^\*\n]+?)\*/', '<strong>$1</strong>', $html);

        // Convert italic text (_text_)
        $html = preg_replace('/_([^_\n]+)_/', '<em>$1</em>', $html);

        // Convert underlined text (+text+)
        $html = preg_replace('/\+([^\+\n]+)\+/', '<u>$1</u>', $html);

        // Convert strikethrough text (-text-) - but not list markers (- followed by space at line start)
        $html = preg_replace('/\-(?! )([^\-\n]+?)\-/', '<del>$1</del>', $html);

        // Convert monospace text ({{text}})
        $html = preg_replace('/\{\{([^\}]+)\}\}/', '<code>$1</code>', $html);

        // Convert color markup {color:red}text{color}
        $html = preg_replace('/\{color:([^\}]+)\}(.*?)\{color\}/s', '<span style="color:$1">$2</span>', $html);

        // Convert links [text|url] or [url]
        $html = preg_replace('/\[([^\|\]]+)\|([^\]]+)\]/', '<a href="$2">$1</a>', $html);
        $html = preg_replace('/\[([^\]]+)\]/', '<a href="$1">$1</a>', $html);

        // Step 3: Convert line breaks to <br> tags and wrap in paragraphs
        $html = $this->convertLineBreaks($html);

        return $html;
    }

    /**
     * Convert unordered lists from Jira markup to HTML.
     *
     * @param string $text
     * @return string
     */
    protected function convertUnorderedLists(string $text): string
    {
        $lines = explode("\n", $text);
        $result = [];
        $inList = false;
        $listDepth = 0;

        foreach ($lines as $line) {
            // Match list items starting with optional whitespace, then * or -, then space and content
            if (preg_match('/^\s*(\*+|\-+)\s+(.+)$/', $line, $matches)) {
                $depth = strlen($matches[1]);
                $content = $matches[2];

                if (!$inList) {
                    $result[] = '<ul>';
                    $inList = true;
                    $listDepth = $depth;
                } elseif ($depth > $listDepth) {
                    $result[] = '<ul>';
                    $listDepth = $depth;
                } elseif ($depth < $listDepth) {
                    for ($i = $listDepth; $i > $depth; $i--) {
                        $result[] = '</ul>';
                    }
                    $listDepth = $depth;
                }

                $result[] = '<li>' . $content . '</li>';
            } else {
                if ($inList) {
                    for ($i = 0; $i < $listDepth; $i++) {
                        $result[] = '</ul>';
                    }
                    $inList = false;
                    $listDepth = 0;
                }
                $result[] = $line;
            }
        }

        if ($inList) {
            for ($i = 0; $i < $listDepth; $i++) {
                $result[] = '</ul>';
            }
        }

        return implode("\n", $result);
    }

    /**
     * Convert ordered lists from Jira markup to HTML.
     *
     * @param string $text
     * @return string
     */
    protected function convertOrderedLists(string $text): string
    {
        $lines = explode("\n", $text);
        $result = [];
        $inList = false;
        $listDepth = 0;

        foreach ($lines as $line) {
            // Match list items starting with optional whitespace, then #, then space and content
            if (preg_match('/^\s*(#+)\s+(.+)$/', $line, $matches)) {
                $depth = strlen($matches[1]);
                $content = $matches[2];

                if (!$inList) {
                    $result[] = '<ol>';
                    $inList = true;
                    $listDepth = $depth;
                } elseif ($depth > $listDepth) {
                    $result[] = '<ol>';
                    $listDepth = $depth;
                } elseif ($depth < $listDepth) {
                    for ($i = $listDepth; $i > $depth; $i--) {
                        $result[] = '</ol>';
                    }
                    $listDepth = $depth;
                }

                $result[] = '<li>' . $content . '</li>';
            } else {
                if ($inList) {
                    for ($i = 0; $i < $listDepth; $i++) {
                        $result[] = '</ol>';
                    }
                    $inList = false;
                    $listDepth = 0;
                }
                $result[] = $line;
            }
        }

        if ($inList) {
            for ($i = 0; $i < $listDepth; $i++) {
                $result[] = '</ol>';
            }
        }

        return implode("\n", $result);
    }

    /**
     * Convert line breaks to appropriate HTML tags.
     *
     * @param string $text
     * @return string
     */
    protected function convertLineBreaks(string $text): string
    {
        // First, split into lines and identify block elements vs inline content
        $lines = explode("\n", $text);
        $result = [];
        $currentParagraph = [];

        foreach ($lines as $line) {
            $trimmed = trim($line);
            
            // Check if this line is a block-level element
            if ($trimmed === '' || preg_match('/^<(h[1-6]|ul|ol|blockquote|pre|div|table|\/ul|\/ol|li)/', $trimmed)) {
                // Flush any accumulated paragraph content
                if (!empty($currentParagraph)) {
                    $para = implode('<br>', $currentParagraph);
                    $result[] = '<p>' . $para . '</p>';
                    $currentParagraph = [];
                }
                
                // Add the block element directly (unless it's empty)
                if ($trimmed !== '') {
                    $result[] = $trimmed;
                }
            } else {
                // Accumulate inline content for paragraph
                $currentParagraph[] = $trimmed;
            }
        }

        // Flush any remaining paragraph content
        if (!empty($currentParagraph)) {
            $para = implode('<br>', $currentParagraph);
            $result[] = '<p>' . $para . '</p>';
        }

        return implode("\n", $result);
    }

    /**
     * Convert Jira tables to HTML tables.
     *
     * @param string $text
     * @return string
     */
    protected function convertTables(string $text): string
    {
        $lines = explode("\n", $text);
        $result = [];
        $inTable = false;
        $isHeader = false;

        foreach ($lines as $line) {
            if (preg_match('/^\|\|(.+)\|\|$/', $line, $matches)) {
                // Header row
                if (!$inTable) {
                    $result[] = '<table>';
                    $result[] = '<thead>';
                    $inTable = true;
                }
                $cells = explode('||', trim($matches[1], '||'));
                $result[] = '<tr>';
                foreach ($cells as $cell) {
                    $result[] = '<th>' . trim($cell) . '</th>';
                }
                $result[] = '</tr>';
                $result[] = '</thead>';
                $result[] = '<tbody>';
                $isHeader = true;
            } elseif (preg_match('/^\|(.+)\|$/', $line, $matches)) {
                // Data row
                if (!$inTable) {
                    $result[] = '<table>';
                    $result[] = '<tbody>';
                    $inTable = true;
                }
                $cells = explode('|', trim($matches[1], '|'));
                $result[] = '<tr>';
                foreach ($cells as $cell) {
                    $result[] = '<td>' . trim($cell) . '</td>';
                }
                $result[] = '</tr>';
            } else {
                if ($inTable) {
                    $result[] = '</tbody>';
                    $result[] = '</table>';
                    $inTable = false;
                    $isHeader = false;
                }
                $result[] = $line;
            }
        }

        if ($inTable) {
            $result[] = '</tbody>';
            $result[] = '</table>';
        }

        return implode("\n", $result);
    }
}
