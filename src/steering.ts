import { promises as fs } from 'fs';
import { join } from 'path';

export interface SteeringDocuments {
  product?: string;
  tech?: string;
  structure?: string;
}

export class SteeringLoader {
  private steeringDir: string;

  constructor(projectRoot: string = process.cwd()) {
    this.steeringDir = join(projectRoot, '.claude', 'steering');
  }

  async loadSteeringDocuments(): Promise<SteeringDocuments> {
    const docs: SteeringDocuments = {};

    try {
      // Check if steering directory exists
      await fs.access(this.steeringDir);

      // Try to load each steering document
      const productPath = join(this.steeringDir, 'product.md');
      const techPath = join(this.steeringDir, 'tech.md');
      const structurePath = join(this.steeringDir, 'structure.md');

      try {
        docs.product = await fs.readFile(productPath, 'utf-8');
      } catch {
        // Product doc not found, that's okay
      }

      try {
        docs.tech = await fs.readFile(techPath, 'utf-8');
      } catch {
        // Tech doc not found, that's okay
      }

      try {
        docs.structure = await fs.readFile(structurePath, 'utf-8');
      } catch {
        // Structure doc not found, that's okay
      }
    } catch {
      // Steering directory doesn't exist, return empty docs
    }

    return docs;
  }

  async steeringDocumentsExist(): Promise<boolean> {
    try {
      await fs.access(this.steeringDir);
      const files = await fs.readdir(this.steeringDir);
      return files.some((file) => ['product.md', 'tech.md', 'structure.md'].includes(file));
    } catch {
      return false;
    }
  }

  formatSteeringContext(docs: SteeringDocuments): string {
    const sections: string[] = [];

    if (docs.product) {
      sections.push('## Product Context\n' + docs.product);
    }

    if (docs.tech) {
      sections.push('## Technology Context\n' + docs.tech);
    }

    if (docs.structure) {
      sections.push('## Structure Context\n' + docs.structure);
    }

    if (sections.length === 0) {
      return '';
    }

    return '# Steering Documents Context\n\n' + sections.join('\n\n---\n\n');
  }
}
