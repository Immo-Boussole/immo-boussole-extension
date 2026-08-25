export function isListingUrl(url) {
    if (!url)
        return false;
    const u = url.toLowerCase();
    return (u.includes('leboncoin.fr/ad/') ||
        u.includes('immobilier.lefigaro.fr/annonces/') ||
        u.includes('lefigaro.fr/annonces/') ||
        u.includes('seloger.com/annonce') ||
        u.includes('bienici.com/annonce') ||
        u.includes('pap.fr/annonces/') ||
        u.includes('logic-immo.com/detail-') ||
        u.includes('ouestfrance-immo.com/immobilier/') ||
        u.includes('bellesdemeures.com/') ||
        u.includes('superimmo.com/annonces/') ||
        u.includes('avendrealouer.fr/vente/') ||
        u.includes('immoreve.fr') ||
        u.includes('admin/crm/index.php') ||
        u.includes('hektor'));
}
