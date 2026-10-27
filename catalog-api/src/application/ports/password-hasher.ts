/** Porta: hashing de senhas (implementado com bcrypt na infraestrutura). */
export abstract class IPasswordHasher {
  abstract hash(plain: string): Promise<string>;
  abstract compare(plain: string, hash: string): Promise<boolean>;
}
