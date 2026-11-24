/**
 * Clase base abstracta para Entidades de Dominio (DDD - Diseño en Modelos)
 * La identidad se define por su identificador único (`id`).
 */
export abstract class Entity<TProps> {
  public readonly id: string;
  protected readonly props: TProps;

  protected constructor(props: TProps, id: string) {
    this.id = id;
    this.props = props;
  }

  public equals(entity?: Entity<TProps>): boolean {
    if (!entity) return false;
    if (this === entity) return true;
    return this.id === entity.id;
  }
}
