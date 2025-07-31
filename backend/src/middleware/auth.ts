import { Request, Response, NextFunction } from 'express';

// Middleware simples de autenticação
export const auth = (req: Request, res: Response, next: NextFunction) => {
  // Por enquanto, vamos apenas prosseguir sem validação
  // Em produção, você implementaria validação de JWT aqui
  next();
};

export default auth;
