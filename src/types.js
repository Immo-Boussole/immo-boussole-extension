export function isListingUrl(url) {
    if (!url)
        return false;
    const u = url.toLowerCase();
    // Reject common search paths
    if (u.includes('/recherche') ||
        u.includes('/resultats') ||
        u.includes('/search') ||
        u.includes('/carte') ||
        u.includes('category=') ||
        u.includes('projects=')) {
        return false;
    }
    // Le Figaro: Must contain /annonce- (search pages are /annonces/immobilier-...)
    if (u.includes('lefigaro.fr')) {
        return u.includes('/annonce-') || u.includes('/annonces/annonce-');
    }
    // SeLoger
    if (u.includes('seloger.com')) {
        return (u.includes('/annonce/') || u.includes('/annonces/')) && !u.includes('/resultats/') && !u.includes('/carte/');
    }
    // LeBonCoin
    if (u.includes('leboncoin.fr')) {
        return u.includes('/ad/') || u.includes('/ventes_immobilieres/') || u.includes('/locations/');
    }
    // Bien'Ici
    if (u.includes('bienici.com')) {
        return u.includes('/annonce/') && !u.includes('/recherche/');
    }
    return (u.includes('pap.fr/annonces/annonce-') ||
        u.includes('pap.fr/annonce/') ||
        u.includes('logic-immo.com/detail-') ||
        u.includes('ouestfrance-immo.com/immobilier/') ||
        u.includes('bellesdemeures.com/') ||
        u.includes('superimmo.com/annonces/') ||
        u.includes('avendrealouer.fr/vente/') ||
        u.includes('immoreve.fr') ||
        u.includes('admin/crm/index.php') ||
        u.includes('hektor'));
}
