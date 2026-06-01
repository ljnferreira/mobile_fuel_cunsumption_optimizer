import { db } from '../database/database';
import type { Usuario } from '../models';

export class UsuarioRepository {
  static findFirst(): Usuario | null {
    try {
      return db.getFirstSync<Usuario>('SELECT * FROM usuario LIMIT 1;') || null;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }
  }

  static insert(nome: string): boolean {
    try {
      db.runSync('INSERT INTO usuario (nome) VALUES (?);', [nome.trim()]);
      return true;
    } catch (error) {
      console.error('Erro ao inserir usuário:', error);
      return false;
    }
  }

  static count(): number {
    try {
      const result = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM usuario;');
      return result?.count || 0;
    } catch (error) {
      console.error('Erro ao contar usuários:', error);
      return 0;
    }
  }
}
