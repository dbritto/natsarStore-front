/**
 * Patrón Result<T> del Shared Kernel (DDD)
 * Encapsula éxitos y fallos de dominio o aplicación sin lanzar excepciones no controladas.
 */
export class Result<T> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  public readonly error: string | null;
  private readonly _value?: T;

  private constructor(isSuccess: boolean, error?: string | null, value?: T) {
    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.error = error ?? null;
    this._value = value;
    Object.freeze(this);
  }

  public getValue(): T {
    if (!this.isSuccess || this._value === undefined) {
      throw new Error(`No se puede obtener el valor de un Result fallido: ${this.error}`);
    }
    return this._value;
  }

  public static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, null, value);
  }

  public static fail<U>(error: string): Result<U> {
    return new Result<U>(false, error);
  }
}
