<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  
  <xsl:template match="/">
    <html>
      <head>
        <title>PropertPro Sitemap - URLs</title>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .header {
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            color: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header h1 {
            margin: 0;
            font-size: 2em;
          }
          .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
          }
          .navigation {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .navigation a {
            display: inline-block;
            margin-right: 15px;
            margin-bottom: 10px;
            padding: 8px 16px;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            text-decoration: none;
            color: #2563eb;
            transition: all 0.2s;
          }
          .navigation a:hover {
            background: #e3f2fd;
            border-color: #2563eb;
          }
          .sitemap-list {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .sitemap-list h2 {
            margin-top: 0;
            color: #2563eb;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
          }
          th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #495057;
          }
          tr:hover {
            background-color: #f8f9fa;
          }
          a {
            color: #2563eb;
            text-decoration: none;
            word-break: break-all;
          }
          a:hover {
            text-decoration: underline;
          }
          .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85em;
            font-weight: 500;
          }
          .badge-high {
            background-color: #d1fae5;
            color: #065f46;
          }
          .badge-medium {
            background-color: #dbeafe;
            color: #1e40af;
          }
          .badge-low {
            background-color: #f3f4f6;
            color: #374151;
          }
          .footer {
            margin-top: 30px;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 0.9em;
          }
          .back-link {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            background: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            transition: background 0.2s;
          }
          .back-link:hover {
            background: #1e40af;
          }
          .url-count {
            margin: 15px 0;
            color: #6c757d;
            font-size: 0.9em;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🗺️ PropertPro Sitemap</h1>
          <p>Complete list of URLs indexed on PropertPro</p>
        </div>
        
        <div class="navigation">
          <strong>Navigation:</strong>
          <a href="/sitemap.xml">📋 Sitemap Index</a>
          <a href="/sitemap-static.xml">📄 Static Pages</a>
          <a href="/sitemap-properties.xml">🏠 Properties</a>
          <a href="/sitemap-profiles.xml">👤 Profiles</a>
          <a href="/sitemap-locations.xml">📍 Locations</a>
          <a href="/sitemap-developers.xml">🏢 Developers</a>
          <a href="/sitemap">🎨 Visual Viewer</a>
          <a href="/">🏡 Home</a>
        </div>
        
        <div class="sitemap-list">
          <h2>URLs</h2>
          <div class="url-count">
            Total URLs: <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></strong>
          </div>
          <table>
            <thead>
              <tr>
                <th>URL</th>
                <th>Last Modified</th>
                <th>Change Frequency</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <xsl:sort select="sitemap:priority" order="descending" data-type="number"/>
                <tr>
                  <td>
                    <a href="{sitemap:loc}" target="_blank">
                      <xsl:value-of select="sitemap:loc"/>
                    </a>
                  </td>
                  <td>
                    <xsl:value-of select="sitemap:lastmod"/>
                  </td>
                  <td>
                    <span class="badge badge-medium">
                      <xsl:value-of select="sitemap:changefreq"/>
                    </span>
                  </td>
                  <td>
                    <xsl:variable name="priority" select="sitemap:priority"/>
                    <xsl:choose>
                      <xsl:when test="$priority >= 0.8">
                        <span class="badge badge-high">
                          <xsl:value-of select="$priority"/>
                        </span>
                      </xsl:when>
                      <xsl:when test="$priority >= 0.5">
                        <span class="badge badge-medium">
                          <xsl:value-of select="$priority"/>
                        </span>
                      </xsl:when>
                      <xsl:otherwise>
                        <span class="badge badge-low">
                          <xsl:value-of select="$priority"/>
                        </span>
                      </xsl:otherwise>
                    </xsl:choose>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <p>Click any URL to visit the page. For search engines: Submit <a href="/sitemap.xml">/sitemap.xml</a> to Google Search Console</p>
          <a href="/sitemap.xml" class="back-link">← Back to Sitemap Index</a>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>

