import React from 'react';
import clsx from 'clsx';
import { shellTokens } from '../tokens';

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export const Card: React.FC<CardProps> = ({ children, className }) => {
  return <section className={clsx(shellTokens.card, className)}>{children}</section>;
};

export const SectionCard: React.FC<CardProps> = ({ children, className }) => {
  return <section className={clsx(shellTokens.cardSoft, className)}>{children}</section>;
};

export const DataTableCard: React.FC<CardProps> = ({ children, className }) => {
  return <section className={clsx(shellTokens.card, 'overflow-hidden', className)}>{children}</section>;
};

export default Card;
