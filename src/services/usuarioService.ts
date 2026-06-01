import { UsuarioRepository } from '../repositories/UsuarioRepository';
import type { Usuario } from '../models';
export type { Usuario } from '../models';

export class UsuarioService {
  static carregarUsuario(): Usuario | null {
    return UsuarioRepository.findFirst();
  }

  static cadastrar(nome: string): { sucesso: boolean; erro?: string } {
    if (!nome.trim()) {
      return { sucesso: false, erro: 'Nome do usuário é obrigatório' };
    }

    const sucesso = UsuarioRepository.insert(nome);
    if (!sucesso) {
      return { sucesso: false, erro: 'Erro ao salvar usuário no banco' };
    }

    return { sucesso: true };
  }

  static contarTotal(): number {
    return UsuarioRepository.count();
  }
}
