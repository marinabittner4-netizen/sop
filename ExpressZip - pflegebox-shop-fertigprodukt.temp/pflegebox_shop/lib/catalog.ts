export type CatalogItem = {
  productId: string;
  name: string;
  category: string;
  unitPrice: number;
  sizes?: string[];
};

// Beispiel-Katalog – passe später einfach Preise/Bilder/IDs an.
export const CATALOG: CatalogItem[] = [
  { productId: 'handschuhe', name: 'Einmalhandschuhe', category: 'Handschuhe', unitPrice: 6.99, sizes: ['S','M','L','XL'] },
  { productId: 'handdesi', name: 'Händedesinfektion (Gel)', category: 'Desinfektion', unitPrice: 4.49 },
  { productId: 'flachendesi', name: 'Flächendesinfektionstücher (80–100 Stk.)', category: 'Desinfektion', unitPrice: 4.99 },
  { productId: 'handtucher', name: 'Händedesinfektionstücher (80–100 Stk.)', category: 'Desinfektion', unitPrice: 4.99 },
  { productId: 'bettschutz', name: 'Bettschutzeinlagen', category: 'Schutz', unitPrice: 7.99 },
  { productId: 'masken', name: 'Mundschutz/Masken', category: 'Schutz', unitPrice: 5.49 },
  { productId: 'schutzschurzen', name: 'Schutzschürzen', category: 'Schutz', unitPrice: 6.49 },
  { productId: 'waschlotion', name: 'Waschlotion', category: 'Hygiene', unitPrice: 5.99 }
];
