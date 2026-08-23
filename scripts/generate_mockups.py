import os

html_template = """<!DOCTYPE html>
<html lang="{lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1280, height=800">
  <title>{page_title}</title>
  <style>
    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }}
    body {{
      width: 1280px;
      height: 800px;
      overflow: hidden;
      background: #0f172a;
      display: flex;
      flex-direction: column;
    }}
    
    /* Browser Frame */
    .browser-frame {{
      background: #1e293b;
      border-bottom: 1px solid #334155;
      display: flex;
      flex-direction: column;
    }}
    .browser-tabs {{
      display: flex;
      align-items: center;
      padding: 8px 12px 0;
      gap: 6px;
    }}
    .browser-dot {{
      width: 12px;
      height: 12px;
      border-radius: 50%;
      display: inline-block;
      margin-right: 2px;
    }}
    .dot-red {{ background: #ef4444; }}
    .dot-yellow {{ background: #f59e0b; }}
    .dot-green {{ background: #10b981; }}
    .dots-container {{
      display: flex;
      gap: 6px;
      margin-right: 12px;
    }}
    .tab {{
      background: #334155;
      color: #f8fafc;
      padding: 8px 16px;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
      width: 250px;
      font-weight: 500;
    }}
    .tab.active {{
      background: #0f172a;
      border-bottom: 2px solid #2563eb;
    }}
    
    .browser-toolbar {{
      display: flex;
      align-items: center;
      padding: 8px 16px;
      background: #0f172a;
      gap: 12px;
      border-bottom: 1px solid #1e293b;
    }}
    .nav-buttons {{
      color: #94a3b8;
      display: flex;
      gap: 12px;
      font-size: 15px;
    }}
    .url-bar {{
      flex: 1;
      background: #1e293b;
      color: #e2e8f0;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
      border: 1px solid #334155;
    }}
    .url-bar .lock {{
      color: #10b981;
      font-size: 12px;
    }}
    .url-bar .domain {{
      color: #60a5fa;
      font-weight: 600;
    }}
    .extension-icons {{
      display: flex;
      align-items: center;
      gap: 12px;
    }}
    .ext-icon-btn {{
      position: relative;
      background: #334155;
      padding: 4px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #475569;
    }}
    .ext-badge {{
      position: absolute;
      bottom: -4px;
      right: -4px;
      background: #10b981;
      color: white;
      font-size: 10px;
      font-weight: bold;
      padding: 1px 4px;
      border-radius: 6px;
      border: 2px solid #0f172a;
    }}
    
    /* Viewport Area */
    .viewport {{
      flex: 1;
      position: relative;
      background: #f8fafc;
      overflow: hidden;
      display: flex;
    }}
    
    /* Property Portal Webpage Mock */
    .page-content {{
      flex: 1;
      padding: 32px 48px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      background: #ffffff;
    }}
    .portal-header {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 16px;
    }}
    .portal-logo {{
      font-size: 20px;
      font-weight: 800;
      color: #ea580c;
      letter-spacing: -0.5px;
    }}
    .listing-headline {{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }}
    .listing-title {{
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
    }}
    .listing-location {{
      font-size: 15px;
      color: #64748b;
    }}
    .listing-price {{
      font-size: 28px;
      font-weight: 800;
      color: #2563eb;
      text-align: right;
    }}
    .listing-price-sqm {{
      font-size: 13px;
      color: #64748b;
    }}
    
    /* Injected Action Button */
    .injected-action-bar {{
      margin: 8px 0;
    }}
    .injected-btn {{
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }}
    .injected-btn img {{
      width: 18px;
      height: 18px;
    }}
    
    .listing-body {{
      display: flex;
      gap: 24px;
    }}
    .photo-grid {{
      flex: 3;
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 12px;
      height: 320px;
    }}
    .photo-main {{
      background: linear-gradient(135deg, #cbd5e1, #94a3b8);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #475569;
      font-size: 14px;
      font-weight: 500;
      position: relative;
      overflow: hidden;
    }}
    .photo-main::after {{
      content: '{photo_caption}';
      position: absolute;
      bottom: 16px;
      left: 16px;
      background: rgba(15, 23, 42, 0.75);
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
    }}
    .photo-side {{
      display: flex;
      flex-direction: column;
      gap: 12px;
    }}
    .photo-thumb {{
      flex: 1;
      background: #e2e8f0;
      border-radius: 8px;
    }}
    .details-sidebar {{
      flex: 2;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }}
    .spec-row {{
      display: flex;
      justify-content: space-between;
      padding-bottom: 8px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 14px;
    }}
    .spec-label {{ color: #64748b; }}
    .spec-val {{ font-weight: 600; color: #0f172a; }}
    
    /* Extension Popup Overlay */
    .popup-overlay {{
      position: absolute;
      top: 12px;
      right: 24px;
      width: 360px;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      z-index: 100;
    }}
    .popup-header {{
      background: #0f172a;
      color: white;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }}
    .popup-brand {{
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 15px;
      font-weight: 700;
    }}
    .popup-version {{
      background: #334155;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      color: #94a3b8;
    }}
    .badge-connected {{
      background: #065f46;
      color: #34d399;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
    }}
    .badge-connected::before {{
      content: '';
      width: 6px;
      height: 6px;
      background: #34d399;
      border-radius: 50%;
    }}
    .popup-body {{
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      background: #f8fafc;
    }}
    .card {{
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
    }}
    .card-title {{
      font-size: 12px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
    }}
    .server-info {{
      font-size: 13px;
      color: #0f172a;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
    }}
    .btn-action-primary {{
      width: 100%;
      background: #2563eb;
      color: white;
      padding: 11px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: none;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.2);
    }}
    .checkbox-row {{
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #64748b;
    }}
    .checkbox-row input {{
      accent-color: #2563eb;
    }}
    .popup-footer {{
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
      padding-top: 4px;
    }}
  </style>
</head>
<body>
  <!-- Browser Frame -->
  <div class="browser-frame">
    <div class="browser-tabs">
      <div class="dots-container">
        <span class="browser-dot dot-red"></span>
        <span class="browser-dot dot-yellow"></span>
        <span class="browser-dot dot-green"></span>
      </div>
      <div class="tab active">
        <span>{tab_title}</span>
      </div>
      <div class="tab">
        <span>{dashboard_tab}</span>
      </div>
    </div>
    <div class="browser-toolbar">
      <div class="nav-buttons">
        <span>◀</span>
        <span>▶</span>
        <span>⟳</span>
      </div>
      <div class="url-bar">
        <span class="lock">🔒</span>
        <span>https://</span><span class="domain">{domain}</span><span>{url_path}</span>
      </div>
      <div class="extension-icons">
        <div class="ext-icon-btn">
          <img src="__ICON_32__" width="22" height="22" alt="Logo" />
          <span class="ext-badge">✔</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Viewport Area -->
  <div class="viewport">
    <div class="page-content">
      <div class="portal-header">
        <div class="portal-logo">{portal_name}</div>
        <div style="font-size: 13px; color: #64748b;">{ref_text}</div>
      </div>

      <div class="listing-headline">
        <div>
          <h1 class="listing-title">{headline_title}</h1>
          <div class="listing-location">{headline_location}</div>
        </div>
        <div>
          <div class="listing-price">{price}</div>
          <div class="listing-price-sqm">{price_sqm}</div>
        </div>
      </div>

      <div class="injected-action-bar">
        <div class="injected-btn">
          <img src="__ICON_32__" alt="Logo" />
          <span>{injected_btn_text}</span>
        </div>
      </div>

      <div class="listing-body">
        <div class="photo-grid">
          <div class="photo-main"></div>
          <div class="photo-side">
            <div class="photo-thumb" style="background:#cbd5e1;"></div>
            <div class="photo-thumb" style="background:#e2e8f0;"></div>
          </div>
        </div>
        <div class="details-sidebar">
          <div style="font-size: 15px; font-weight: 700; color: #0f172a;">{specs_title}</div>
          <div class="spec-row">
            <span class="spec-label">{spec1_label}</span>
            <span class="spec-val">140 m²</span>
          </div>
          <div class="spec-row">
            <span class="spec-label">{spec2_label}</span>
            <span class="spec-val">{spec2_val}</span>
          </div>
          <div class="spec-row">
            <span class="spec-label">{spec3_label}</span>
            <span class="spec-val">{spec3_val}</span>
          </div>
          <div class="spec-row">
            <span class="spec-label">{spec4_label}</span>
            <span class="spec-val" style="color: #10b981;">B (85 kWh/m²)</span>
          </div>
          <div class="spec-row">
            <span class="spec-label">{spec5_label}</span>
            <span class="spec-val">{spec5_val}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Extension Popup Overlay -->
    <div class="popup-overlay">
      <div class="popup-header">
        <div class="popup-brand">
          <img src="__ICON_32__" width="22" height="22" alt="Logo" />
          <span>Immo-Boussole</span>
          <span class="popup-version">v1.0.0</span>
        </div>
        <span class="badge-connected">{connected_badge}</span>
      </div>

      <div class="popup-body">
        <div class="card">
          <div class="card-title">
            <span>{server_card_title}</span>
            <span style="color: #10b981; font-weight: bold;">● {active_badge}</span>
          </div>
          <div class="server-info">
            <span>🌐</span>
            <span>{instance_url}</span>
          </div>
        </div>

        <button class="btn-action-primary">
          <span>➕</span>
          <span>{add_tab_btn}</span>
        </button>

        <div class="checkbox-row">
          <input type="checkbox" id="open-tab" checked />
          <label for="open-tab">{open_tab_label}</label>
        </div>

        <div class="popup-footer">
          {popup_footer}
        </div>
      </div>
    </div>
  </div>
</body>
</html>
"""

# EN version
en_data = {
    'lang': 'en',
    'page_title': 'Immo-Boussole Showcase',
    'tab_title': '🏡 Modern House 140 m² - ...',
    'dashboard_tab': '🧭 Immo-Boussole Dashboard',
    'domain': 'www.realestate-portal.com',
    'url_path': '/ad/house-lyon-140m2-3224009953',
    'portal_name': 'PORTAL IMMO',
    'ref_text': 'Ref: #3224009953',
    'headline_title': 'Contemporary Architect House 140 m²',
    'headline_location': '📍 69006 Lyon (Rhône) • 5 Rooms • 3 Bedrooms',
    'price': '€420,000',
    'price_sqm': '€3,000 / m²',
    'injected_btn_text': 'Add to Immo-Boussole',
    'photo_caption': '🏡 Contemporary House & Garden',
    'specs_title': 'Key Characteristics',
    'spec1_label': 'Surface Area',
    'spec2_label': 'Rooms',
    'spec2_val': '5 rooms',
    'spec3_label': 'Bedrooms',
    'spec3_val': '3 bedrooms',
    'spec4_label': 'Energy Class (DPE)',
    'spec5_label': 'Heating',
    'spec5_val': 'Heat Pump',
    'connected_badge': 'Connected',
    'server_card_title': 'Server Instance',
    'active_badge': 'Active',
    'instance_url': 'https://immo.example.com',
    'add_tab_btn': 'Add Current Tab',
    'open_tab_label': 'Open listing in Immo-Boussole after import',
    'popup_footer': 'Syncing with self-hosted Immo-Boussole instance'
}

with open('scripts/mockups/showcase.html', 'w', encoding='utf-8') as f:
    f.write(html_template.format(**en_data))
print('Written clean showcase.html (EN)')

# FR version
fr_data = {
    'lang': 'fr',
    'page_title': 'Aperçu Immo-Boussole (Français)',
    'tab_title': '🏡 Maison 140 m² - Lyon...',
    'dashboard_tab': '🧭 Tableau de bord Immo-Boussole',
    'domain': 'www.portail-immobilier.fr',
    'url_path': '/ad/maison-lyon-140m2-3224009953',
    'portal_name': 'PORTAIL IMMO',
    'ref_text': 'Réf : #3224009953',
    'headline_title': 'Maison d\'architecte contemporaine 140 m²',
    'headline_location': '📍 69006 Lyon (Rhône) • 5 Pièces • 3 Chambres',
    'price': '420 000 €',
    'price_sqm': '3 000 € / m²',
    'injected_btn_text': 'Ajouter à Immo-Boussole',
    'photo_caption': '🏡 Maison contemporaine avec jardin arboré',
    'specs_title': 'Caractéristiques clés',
    'spec1_label': 'Surface habitable',
    'spec2_label': 'Nombre de pièces',
    'spec2_val': '5 pièces',
    'spec3_label': 'Chambres',
    'spec3_val': '3 chambres',
    'spec4_label': 'Classe Énergie (DPE)',
    'spec5_label': 'Chauffage',
    'spec5_val': 'Pompe à chaleur',
    'connected_badge': 'Connecté',
    'server_card_title': 'Serveur Immo-Boussole',
    'active_badge': 'Actif',
    'instance_url': 'https://immo.exemple.fr',
    'add_tab_btn': 'Ajouter l\'onglet actif',
    'open_tab_label': 'Ouvrir l\'annonce après import',
    'popup_footer': 'Synchronisation avec votre instance Immo-Boussole'
}

with open('scripts/mockups/showcase_fr.html', 'w', encoding='utf-8') as f:
    f.write(html_template.format(**fr_data))
print('Written clean showcase_fr.html (FR)')
