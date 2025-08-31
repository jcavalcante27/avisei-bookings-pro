class ExportService {

  /**
   * Converter array de objetos para CSV
   */
  static arrayToCSV(data, filename = 'export') {
    if (!data || data.length === 0) {
      return {
        content: '',
        filename: `${filename}.csv`,
        contentType: 'text/csv'
      };
    }

    // Obter cabeçalhos das chaves do primeiro objeto
    const headers = Object.keys(data[0]);
    
    // Criar linha de cabeçalho
    const csvHeaders = headers.join(',');
    
    // Converter dados para linhas CSV
    const csvRows = data.map(row => {
      return headers.map(header => {
        let value = row[header];
        
        // Tratar valores especiais
        if (value === null || value === undefined) {
          value = '';
        } else if (typeof value === 'string') {
          // Escapar aspas duplas e quebras de linha
          value = value.replace(/"/g, '""');
          // Se contém vírgula, quebra de linha ou aspas, envolver em aspas duplas
          if (value.includes(',') || value.includes('\n') || value.includes('\r') || value.includes('"')) {
            value = `"${value}"`;
          }
        } else if (value instanceof Date) {
          value = value.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        }
        
        return value;
      }).join(',');
    });
    
    // Combinar cabeçalhos e dados
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    
    return {
      content: csvContent,
      filename: `${filename}.csv`,
      contentType: 'text/csv; charset=utf-8'
    };
  }

  /**
   * Formatar dados para JSON com metadados
   */
  static formatJSON(data, metadata = {}) {
    return {
      content: JSON.stringify({
        exported_at: new Date().toISOString(),
        total_records: Array.isArray(data) ? data.length : 1,
        metadata,
        data
      }, null, 2),
      filename: `${metadata.filename || 'export'}.json`,
      contentType: 'application/json'
    };
  }

  /**
   * Formatar dados de agendamentos para exportação
   */
  static formatAppointmentsForExport(appointments, format = 'json') {
    const formattedData = appointments.map(apt => ({
      id: apt.id,
      data: apt.appointment_date instanceof Date 
        ? apt.appointment_date.toISOString().split('T')[0] 
        : apt.appointment_date,
      horario: apt.appointment_time,
      status: apt.status,
      cliente: apt.client_name,
      telefone_cliente: apt.client_phone || apt.client_email,
      profissional: apt.professional_name,
      servico: apt.service_name,
      duracao_minutos: apt.duration,
      preco: parseFloat(apt.price || 0).toFixed(2),
      comissao_percent: parseFloat(apt.commission_percentage || 0).toFixed(2),
      comissao_valor: parseFloat(apt.commission_amount || 0).toFixed(2),
      criado_em: apt.created_at instanceof Date 
        ? apt.created_at.toISOString().split('T')[0] 
        : apt.created_at
    }));

    if (format === 'csv') {
      return this.arrayToCSV(formattedData, 'agendamentos');
    } else {
      return this.formatJSON(formattedData, {
        filename: 'agendamentos',
        type: 'appointments_report',
        total_revenue: formattedData.reduce((sum, apt) => sum + parseFloat(apt.preco), 0),
        total_commission: formattedData.reduce((sum, apt) => sum + parseFloat(apt.comissao_valor), 0)
      });
    }
  }

  /**
   * Formatar dados de comissões para exportação
   */
  static formatCommissionsForExport(commissions, format = 'json') {
    const formattedData = commissions.map(comm => ({
      id: comm.id,
      data: comm.appointment_date instanceof Date 
        ? comm.appointment_date.toISOString().split('T')[0] 
        : comm.appointment_date,
      horario: comm.appointment_time,
      cliente: comm.client_name,
      servico: comm.service_name,
      preco_servico: parseFloat(comm.price || 0).toFixed(2),
      percentual_comissao: parseFloat(comm.commission_percentage || 0).toFixed(2),
      valor_comissao: parseFloat(comm.commission_amount || 0).toFixed(2)
    }));

    if (format === 'csv') {
      return this.arrayToCSV(formattedData, 'comissoes');
    } else {
      return this.formatJSON(formattedData, {
        filename: 'comissoes',
        type: 'commissions_report',
        total_commission: formattedData.reduce((sum, comm) => sum + parseFloat(comm.valor_comissao), 0),
        total_revenue: formattedData.reduce((sum, comm) => sum + parseFloat(comm.preco_servico), 0)
      });
    }
  }

  /**
   * Formatar dados de usuários para exportação
   */
  static formatUsersForExport(users, format = 'json') {
    const formattedData = users.map(user => ({
      id: user.id,
      nome: user.name,
      email: user.email,
      telefone: user.phone || '',
      tipo_usuario: user.user_type,
      ativo: user.active ? 'Sim' : 'Não',
      estabelecimento_id: user.establishment_id || '',
      data_cadastro: user.created_at instanceof Date 
        ? user.created_at.toISOString().split('T')[0] 
        : user.created_at
    }));

    if (format === 'csv') {
      return this.arrayToCSV(formattedData, 'usuarios');
    } else {
      return this.formatJSON(formattedData, {
        filename: 'usuarios',
        type: 'users_report',
        total_users: formattedData.length,
        active_users: formattedData.filter(u => u.ativo === 'Sim').length
      });
    }
  }

  /**
   * Formatar dados de estabelecimentos para exportação
   */
  static formatEstablishmentsForExport(establishments, format = 'json') {
    const formattedData = establishments.map(est => ({
      id: est.id,
      nome: est.name,
      email: est.email,
      telefone: est.phone || '',
      ativo: est.active ? 'Sim' : 'Não',
      total_servicos: est.services_count || 0,
      total_funcionarios: est.employees_count || 0,
      data_cadastro: est.created_at instanceof Date 
        ? est.created_at.toISOString().split('T')[0] 
        : est.created_at
    }));

    if (format === 'csv') {
      return this.arrayToCSV(formattedData, 'estabelecimentos');
    } else {
      return this.formatJSON(formattedData, {
        filename: 'estabelecimentos',
        type: 'establishments_report',
        total_establishments: formattedData.length,
        active_establishments: formattedData.filter(e => e.ativo === 'Sim').length
      });
    }
  }
}

export default ExportService;