import { VeiculoRepository } from '../repositories/VeiculoRepository';
import type { Veiculo } from '../models';
export type { Veiculo } from '../models';

export class VeiculoService {
  /**
   * Carrega todos os veículos do banco de dados
   */
  static carregarTodos(): Veiculo[] {
    return VeiculoRepository.findAll();
  }

  /**
   * Carrega um veículo específico por ID
   */
  static carregarPorId(id: number): Veiculo | null {
    return VeiculoRepository.findById(id);
  }

  /**
   * Cadastra um novo veículo
   */
  static cadastrar(
    nome: string,
    capacidadeTanque: number,
    odometroInicial: number
  ): { sucesso: boolean; erro?: string } {
    if (!nome.trim()) {
      return { sucesso: false, erro: 'Nome do veículo é obrigatório' };
    }

    if (capacidadeTanque <= 0) {
      return { sucesso: false, erro: 'Capacidade do tanque deve ser maior que 0' };
    }

    if (odometroInicial < 0) {
      return { sucesso: false, erro: 'Odômetro não pode ser negativo' };
    }

    const sucesso = VeiculoRepository.insert(nome, capacidadeTanque, odometroInicial);
    if (!sucesso) {
      return { sucesso: false, erro: 'Erro ao salvar veículo no banco' };
    }

    return { sucesso: true };
  }

  /**
   * Atualiza um veículo existente
   */
  static atualizar(
    id: number,
    nome: string,
    capacidadeTanque: number,
    odometroInicial: number
  ): { sucesso: boolean; erro?: string } {
    if (!nome.trim()) {
      return { sucesso: false, erro: 'Nome do veículo é obrigatório' };
    }

    const sucesso = VeiculoRepository.update(id, nome, capacidadeTanque, odometroInicial);
    if (!sucesso) {
      return { sucesso: false, erro: 'Erro ao atualizar veículo' };
    }

    return { sucesso: true };
  }

  /**
   * Deleta um veículo
   */
  static deletar(id: number): { sucesso: boolean; erro?: string } {
    const sucesso = VeiculoRepository.delete(id);
    if (!sucesso) {
      return { sucesso: false, erro: 'Erro ao deletar veículo' };
    }

    return { sucesso: true };
  }

  /**
   * Conta o total de veículos
   */
  static contarTotal(): number {
    return VeiculoRepository.count();
  }
}
