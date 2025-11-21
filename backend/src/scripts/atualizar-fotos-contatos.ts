import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TicketService } from '../modules/atendimento/services/ticket.service';
import { WhatsAppSenderService } from '../modules/atendimento/services/whatsapp-sender.service';
import { Repository } from 'typeorm';
import { Ticket } from '../modules/atendimento/entities/ticket.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

/**
 * 🖼️ SCRIPT: ATUALIZAR FOTOS DOS CONTATOS
 *
 * Este script busca todos os tickets que não têm foto do contato (contatoFoto = null)
 * e tenta buscar a foto do perfil na API do WhatsApp.
 *
 * Como executar:
 * ```bash
 * cd backend
 * npm run build
 * node dist/src/scripts/atualizar-fotos-contatos.js
 * ```
 */
async function atualizarFotosContatos() {
  console.log('🖼️ Iniciando atualização de fotos dos contatos...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const ticketRepo = app.get<Repository<Ticket>>(getRepositoryToken(Ticket));
  const whatsappService = app.get(WhatsAppSenderService);

  try {
    // Buscar todos os tickets sem foto
    const ticketsSemFoto = await ticketRepo
      .createQueryBuilder('ticket')
      .where('ticket.contatoFoto IS NULL')
      .andWhere('ticket.contatoTelefone IS NOT NULL')
      .getMany();

    console.log(`📊 Total de tickets sem foto: ${ticketsSemFoto.length}\n`);

    if (ticketsSemFoto.length === 0) {
      console.log('✅ Todos os tickets já possuem foto!');
      await app.close();
      return;
    }

    let atualizados = 0;
    let erros = 0;
    let semFoto = 0;

    for (const ticket of ticketsSemFoto) {
      try {
        console.log(`🔍 Processando ticket #${ticket.numero} (${ticket.contatoNome})...`);
        console.log(`   Telefone: ${ticket.contatoTelefone}`);
        console.log(`   Empresa: ${ticket.empresaId}`);

        // Buscar foto na API do WhatsApp
        const fotoUrl = await whatsappService.buscarFotoPerfilContato(
          ticket.empresaId,
          ticket.contatoTelefone,
        );

        if (fotoUrl) {
          // Atualizar ticket com a foto
          ticket.contatoFoto = fotoUrl;
          await ticketRepo.save(ticket);

          console.log(`   ✅ Foto atualizada: ${fotoUrl.substring(0, 60)}...`);
          atualizados++;
        } else {
          console.log(`   ℹ️ Sem foto disponível`);
          semFoto++;
        }

        // Aguardar 500ms entre requisições para evitar rate limit
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
        erros++;
      }

      console.log(''); // Linha em branco
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 RESUMO DA ATUALIZAÇÃO');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ Tickets atualizados: ${atualizados}`);
    console.log(`ℹ️ Sem foto disponível: ${semFoto}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`📊 Total processado: ${ticketsSemFoto.length}`);
    console.log('═══════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Erro ao atualizar fotos:', error);
  } finally {
    await app.close();
  }
}

// Executar script
atualizarFotosContatos()
  .then(() => {
    console.log('✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
