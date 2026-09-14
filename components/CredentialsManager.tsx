import React, { useState, useMemo, useEffect } from 'react';
import { User, UserPermissions, UserAccessRequest } from '../types';
import { createAuthUserByAdmin, getUserAccessRequests, updateUserAccessRequest } from '../lib/supabase';
import { ModalSolicitarAcesso } from './ModalSolicitarAcesso';

interface CredentialsManagerProps {
  users: User[];
  currentUser?: User;
  onUpdateUsers: (users: User[]) => void;
}

const DEFAULT_PERMISSIONS: UserPermissions = {
  centroCusto: true,
  contasPagar: true,
  contasReceber: true,
  dashboard: true,
  fluxoCaixa: true,
  detalhes: true,
  planCredencias: true,
  gestaoDemandas: true,
  propostas: true,
  financeiro: true,
  estruturaProposta: true,
  comissoes: true,
  cotacao: true,
  exportarDados: true,
  criarPropostas: true,
  gestaoUsuarios: true,
  rh: true,
  notificacoes: true
};

const CORRETOR_PERMISSIONS: UserPermissions = {
  centroCusto: false,
  contasPagar: false,
  contasReceber: false,
  dashboard: false,
  fluxoCaixa: false,
  detalhes: false,
  planCredencias: false,
  gestaoDemandas: false,
  propostas: true,
  financeiro: false,
  estruturaProposta: false,
  comissoes: true,
  cotacao: true,
  exportarDados: false,
  criarPropostas: true,
  gestaoUsuarios: false,
  rh: false,
  notificacoes: false
};

const CARGO_OPTIONS = [
  'Gerente Geral & Financeiro',
  'Gerente Financeiro',
  'Analista Sênior',
  'Analista Pleno',
  'Gestor Comercial',
  'Assistente Comercial',
  'Corretor Autorizado',
  'Corretor Parceiro',
  'Administrador'
];

const CredentialsManager: React.FC<CredentialsManagerProps> = ({ users = [], currentUser, onUpdateUsers }) => {
  const [activeCredTab, setActiveCredTab] = useState<'usuarios' | 'aprovacoes'>('usuarios');
  const [selectedUserLogin, setSelectedUserLogin] = useState<string>(users[0]?.login || 'admin');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingCargoInlineFor, setEditingCargoInlineFor] = useState<string | null>(null);
  const [pendingCargos, setPendingCargos] = useState<Record<string, string>>({});

  // Access Requests state (solicitações internas)
  const [accessRequests, setAccessRequests] = useState<UserAccessRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [requestFilter, setRequestFilter] = useState<'TODOS' | 'PENDENTE' | 'APROVADO' | 'RECUSADO'>('PENDENTE');
  const [requestSearchTerm, setRequestSearchTerm] = useState('');
  const [requestConfigs, setRequestConfigs] = useState<Record<string, { cargo: string; password: string }>>({});
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [rejectModalData, setRejectModalData] = useState<{
    open: boolean;
    request: UserAccessRequest | null;
    reason: string;
  }>({ open: false, request: null, reason: '' });

  // Load access requests from Supabase / localStorage
  const loadRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const data = await getUserAccessRequests();
      setAccessRequests(data);
    } catch (err) {
      console.warn('Erro ao carregar solicitações de acesso:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // New user form state
  const [newLogin, setNewLogin] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newSenha, setNewSenha] = useState('');
  const [newCargo, setNewCargo] = useState('Analista Sênior');
  const [newStatus, setNewStatus] = useState<'ATIVO' | 'INATIVO'>('ATIVO');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Edit user state
  const [editUserData, setEditUserData] = useState<{
    login: string;
    email: string;
    senha: string;
    cargo: string;
    role?: string;
    status: 'ATIVO' | 'INATIVO';
  }>({
    login: '',
    email: '',
    senha: '',
    cargo: '',
    role: '',
    status: 'ATIVO'
  });

  // Separate active and pending users
  const pendingUsers = useMemo(() => {
    return users.filter(u => u.approved === false || (u as any).approved === 'false');
  }, [users]);

  const activeUsers = useMemo(() => {
    return users.filter(u => u.approved !== false && (u as any).approved !== 'false');
  }, [users]);

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    const list = activeCredTab === 'aprovacoes' ? pendingUsers : activeUsers;
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(u =>
      (u.login || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.cargo || '').toLowerCase().includes(term)
    );
  }, [activeCredTab, pendingUsers, activeUsers, searchTerm]);

  // Currently selected user for editing permissions in right panel
  const selectedUser = useMemo(() => {
    return users.find(u => (u.login || '').trim().toLowerCase() === (selectedUserLogin || '').trim().toLowerCase()) || filteredUsers[0] || users[0];
  }, [users, selectedUserLogin, filteredUsers]);

  // Temporary permissions state for the right panel editor
  const [editingPermissions, setEditingPermissions] = useState<UserPermissions>(
    selectedUser?.permissions || DEFAULT_PERMISSIONS
  );
  const [selectedUserCargo, setSelectedUserCargo] = useState<string>(
    selectedUser?.cargo || (selectedUser?.login?.toLowerCase() === 'admin' ? 'Gerente Geral & Financeiro' : 'Analista Sênior')
  );
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [addModalError, setAddModalError] = useState<string | null>(null);
  const [globalNotification, setGlobalNotification] = useState<{
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
    details?: string;
  } | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Sync state whenever selected user or users list updates
  useEffect(() => {
    if (selectedUser) {
      const currentCargo = selectedUser.cargo || (selectedUser.login.toLowerCase() === 'admin' ? 'Gerente Geral & Financeiro' : 'Analista Sênior');
      setSelectedUserCargo(currentCargo);
      setEditingPermissions({
        ...DEFAULT_PERMISSIONS,
        ...(selectedUser.permissions || {})
      });
    }
  }, [selectedUser?.login, selectedUser?.cargo]);

  // Update selected user when user row is clicked
  const handleSelectUser = (u: User) => {
    setSelectedUserLogin(u.login);
    const cargoVal = u.cargo || (u.login.toLowerCase() === 'admin' ? 'Gerente Geral & Financeiro' : 'Analista Sênior');
    setSelectedUserCargo(cargoVal);
    setEditingPermissions({
      ...DEFAULT_PERMISSIONS,
      ...(u.permissions || {})
    });
  };

  // Quick change cargo for user directly
  const handleChangeCargo = (userToUpdate: User, newCargoValue: string) => {
    const isCorretor = newCargoValue.toLowerCase().includes('corretor');
    const newRole = isCorretor ? 'corretor' : (newCargoValue.toLowerCase().includes('admin') || userToUpdate.login.toLowerCase() === 'admin' ? 'admin' : (userToUpdate.role || 'admin'));

    const updatedUsers = users.map(u => {
      if ((u.login || '').trim().toLowerCase() === (userToUpdate.login || '').trim().toLowerCase()) {
        return {
          ...u,
          cargo: newCargoValue,
          role: newRole as any,
          permissions: isCorretor ? { ...CORRETOR_PERMISSIONS } : (u.permissions || DEFAULT_PERMISSIONS)
        };
      }
      return u;
    });

    onUpdateUsers(updatedUsers);
    
    if ((selectedUser?.login || '').trim().toLowerCase() === (userToUpdate.login || '').trim().toLowerCase()) {
      setSelectedUserCargo(newCargoValue);
      if (isCorretor) {
        setEditingPermissions({ ...CORRETOR_PERMISSIONS });
      }
    }

    setSaveSuccessMsg(`Função de "${userToUpdate.login}" alterada para "${newCargoValue}" com sucesso!`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Toggle permission item in right panel
  const handleToggleEditingPermission = (key: keyof UserPermissions) => {
    setEditingPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Save permissions & cargo for selected user
  const handleSavePermissions = () => {
    if (!selectedUser) return;

    const isCorretor = selectedUserCargo.toLowerCase().includes('corretor');
    const newRole = isCorretor ? 'corretor' : (selectedUserCargo.toLowerCase().includes('admin') || selectedUser.login.toLowerCase() === 'admin' ? 'admin' : (selectedUser.role || 'admin'));

    const updatedUsers = users.map(u => {
      if ((u.login || '').trim().toLowerCase() === (selectedUser.login || '').trim().toLowerCase()) {
        return {
          ...u,
          cargo: selectedUserCargo,
          role: newRole as any,
          permissions: { ...editingPermissions }
        };
      }
      return u;
    });

    onUpdateUsers(updatedUsers);
    setSaveSuccessMsg(`Alterações salvas com sucesso para "${selectedUser.login}"!`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Open delete confirmation modal
  const handleDeleteUser = (u?: User, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = u || selectedUser;
    if (!target) return;
    if (target.login.toLowerCase() === 'admin') {
      setSaveSuccessMsg('O usuário administrador master (admin) não pode ser excluído.');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
      return;
    }
    setUserToDelete(target);
  };

  // Confirm delete user execution
  const handleConfirmDeleteUser = () => {
    if (!userToDelete) return;
    if (userToDelete.login.toLowerCase() === 'admin') {
      setUserToDelete(null);
      return;
    }

    const updatedUsers = users.filter(
      u => (u.login || '').trim().toLowerCase() !== (userToDelete.login || '').trim().toLowerCase()
    );
    onUpdateUsers(updatedUsers);

    if ((selectedUser?.login || '').trim().toLowerCase() === (userToDelete.login || '').trim().toLowerCase()) {
      const nextUser = updatedUsers[0];
      if (nextUser) {
        setSelectedUserLogin(nextUser.login);
        setSelectedUserCargo(nextUser.cargo || 'Analista Sênior');
        setEditingPermissions({ ...DEFAULT_PERMISSIONS, ...(nextUser.permissions || {}) });
      }
    }

    setSaveSuccessMsg(`Usuário "${userToDelete.login}" excluído com sucesso!`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
    setUserToDelete(null);
    setIsEditUserModalOpen(false);
  };

  // Open edit modal for selected user
  const handleOpenEditUserModal = (u: User) => {
    setEditUserData({
      login: u.login,
      email: u.email || '',
      senha: u.senha || '',
      cargo: u.cargo || 'Analista Sênior',
      role: u.role || 'admin',
      status: u.status === 'INATIVO' ? 'INATIVO' : 'ATIVO'
    });
    setIsEditUserModalOpen(true);
  };

  // Save edited user from modal
  const handleSaveEditUserModal = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = (editUserData.email || '').trim().toLowerCase();
    const cleanLogin = (editUserData.login || '').trim().toLowerCase();

    // Check if another user already uses this email or login
    const isDuplicateEmail = users.some(u => 
      (u.login || '').trim().toLowerCase() !== cleanLogin &&
      (u.email || '').trim().toLowerCase() === cleanEmail
    );
    if (isDuplicateEmail) {
      alert(`Já existe outro usuário cadastrado com o e-mail "${editUserData.email}".`);
      return;
    }

    const isCorretor = editUserData.cargo.toLowerCase().includes('corretor');
    const newRole = isCorretor ? 'corretor' : (editUserData.cargo.toLowerCase().includes('admin') || editUserData.login.toLowerCase() === 'admin' ? 'admin' : (editUserData.role || 'admin'));

    const updatedUsers = users.map(u => {
      if ((u.login || '').trim().toLowerCase() === cleanLogin) {
        return {
          ...u,
          email: editUserData.email.trim(),
          senha: editUserData.senha || u.senha,
          cargo: editUserData.cargo,
          role: newRole as any,
          status: editUserData.status,
          permissions: isCorretor ? { ...CORRETOR_PERMISSIONS } : (u.permissions || DEFAULT_PERMISSIONS)
        };
      }
      return u;
    });

    onUpdateUsers(updatedUsers);
    if ((selectedUser?.login || '').trim().toLowerCase() === cleanLogin) {
      setSelectedUserCargo(editUserData.cargo);
      if (isCorretor) {
        setEditingPermissions({ ...CORRETOR_PERMISSIONS });
      }
    }
    setIsEditUserModalOpen(false);
    setSaveSuccessMsg(`Dados do usuário "${editUserData.login}" atualizados com sucesso!`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Create new user submit
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddModalError(null);

    if (!newLogin || !newSenha || !newEmail) {
      setAddModalError('Por favor, preencha todos os campos obrigatórios (Login, E-mail e Senha).');
      return;
    }

    if (newSenha.trim().length < 6) {
      setAddModalError('A senha deve ter no mínimo 6 caracteres para atendimento às regras de segurança do Supabase Authentication.');
      return;
    }

    const cleanLogin = newLogin.trim().toLowerCase();
    const cleanEmail = newEmail.trim().toLowerCase();

    const isCorretor = newCargo.toLowerCase().includes('corretor');
    const role = isCorretor ? 'corretor' : 'admin';
    const permissions = isCorretor ? { ...CORRETOR_PERMISSIONS } : { ...DEFAULT_PERMISSIONS };

    setIsCreatingUser(true);

    try {
      // 1. Cadastrar no Supabase Auth (sem derrubar a sessão do admin) e nas tabelas profiles e users
      const authResult = await createAuthUserByAdmin({
        email: newEmail.trim(),
        password: newSenha.trim(),
        login: newLogin.trim(),
        name: newLogin.trim(),
        cargo: newCargo,
        role: role,
        permissions: permissions
      });

      const isEmailRateLimit = authResult.authError && (
        authResult.authError.toLowerCase().includes('rate limit') ||
        authResult.authError.toLowerCase().includes('email rate limit exceeded')
      );
      const isAlreadyRegistered = authResult.authError && authResult.authError.toLowerCase().includes('already registered');

      // Se ocorreu erro crítico no Supabase Auth que NÃO seja rate limit ou e-mail já existente
      if (authResult.authError && !authResult.authUserId && !isAlreadyRegistered && !isEmailRateLimit) {
        console.error('Erro Supabase Auth:', authResult.authError);
        setAddModalError(`Erro retornado pelo Supabase Auth: ${authResult.authError}`);
        setGlobalNotification({
          type: 'error',
          title: 'Erro ao cadastrar no Supabase Auth',
          message: `O Supabase recusou o cadastro de "${newLogin}": ${authResult.authError}`,
          details: 'Verifique se o e-mail é válido ou se a senha atende aos requisitos.'
        });
        setIsCreatingUser(false);
        return;
      }

      const newUser: User = {
        id: authResult.authUserId || `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        login: newLogin.trim(),
        email: newEmail.trim(),
        senha: newSenha.trim(),
        cargo: newCargo,
        role: role as any,
        status: newStatus,
        ultimoAcesso: 'Hoje\n10:00',
        approved: true,
        permissions: permissions
      };

      const existingIndex = users.findIndex(u => 
        (u.login || '').trim().toLowerCase() === cleanLogin ||
        ((u.email || '').trim().toLowerCase() === cleanEmail && cleanEmail.length > 0)
      );

      let updatedUsers: User[];
      if (existingIndex >= 0) {
        updatedUsers = [...users];
        updatedUsers[existingIndex] = { ...users[existingIndex], ...newUser };
      } else {
        updatedUsers = [...users, newUser];
      }

      await onUpdateUsers(updatedUsers);
      setSelectedUserLogin(newUser.login);
      setSelectedUserCargo(newUser.cargo);
      setEditingPermissions(newUser.permissions);

      if (isEmailRateLimit) {
        setGlobalNotification({
          type: 'warning',
          title: 'Usuário Gravado e Acesso Liberado',
          message: `Usuário "${newUser.login}" cadastrado com sucesso no banco de dados e liberado!`,
          details: 'Aviso do Supabase Auth: Limite de envio de e-mails da hora atingido (Rate Limit do provedor), mas o login direto com usuário e senha no sistema está 100% liberado e operacional.'
        });
        setSaveSuccessMsg(`Usuário "${newUser.login}" gravado no sistema com sucesso.`);
      } else if (isAlreadyRegistered) {
        setGlobalNotification({
          type: 'warning',
          title: 'Usuário Gravado no Sistema',
          message: `O usuário "${newUser.login}" foi gravado e liberado com sucesso. (Nota: E-mail já constava no Auth do Supabase).`
        });
        setSaveSuccessMsg(`Usuário "${newUser.login}" gravado no sistema com sucesso.`);
      } else if (authResult.userTableError) {
        setGlobalNotification({
          type: 'warning',
          title: 'Usuário cadastrado com aviso',
          message: `Usuário "${newUser.login}" cadastrado. Aviso na tabela users: ${authResult.userTableError}`
        });
        setSaveSuccessMsg(`Usuário "${newUser.login}" cadastrado com aviso!`);
      } else {
        setGlobalNotification({
          type: 'success',
          title: 'Cadastro Concluído',
          message: `Usuário "${newUser.login}" (${newUser.email}) gravado com sucesso no Supabase e liberado!`
        });
        setSaveSuccessMsg(`Usuário "${newUser.login}" cadastrado com sucesso no Supabase e liberado!`);
      }

      setNewLogin('');
      setNewEmail('');
      setNewSenha('');
      setAddModalError(null);
      setIsAddModalOpen(false);
    } catch (err: any) {
      console.error('Erro ao criar usuário:', err);
      setAddModalError('Ocorreu um erro ao cadastrar o usuário: ' + (err?.message || 'Erro desconhecido'));
      setGlobalNotification({
        type: 'error',
        title: 'Falha no Cadastro',
        message: err?.message || 'Erro desconhecido ao processar cadastro de usuário.'
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Toggle status of user (Ativo/Inativo)
  const handleToggleUserStatus = (u: User, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (u.login.toLowerCase() === 'admin') {
      setSaveSuccessMsg('O administrador master (admin) não pode ser inativado.');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
      return;
    }
    const nextStatus = u.status === 'INATIVO' ? 'ATIVO' : 'INATIVO';
    const updatedUsers = users.map(item =>
      (item.login || '').trim().toLowerCase() === (u.login || '').trim().toLowerCase()
        ? { ...item, status: nextStatus }
        : item
    );
    onUpdateUsers(updatedUsers);
    setSaveSuccessMsg(`Status de "${u.login}" alterado para ${nextStatus === 'ATIVO' ? 'Ativo (Acesso Liberado)' : 'Inativo (Acesso Bloqueado)'}!`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Approval handlers for pending users (legacy)
  const handleApprovePendingUser = (userToApprove: User, customCargo?: string) => {
    const cargoVal = customCargo || pendingCargos[userToApprove.login] || userToApprove.cargo || 'Analista Sênior';
    const isCorretor = cargoVal.toLowerCase().includes('corretor');
    const roleVal = isCorretor ? 'corretor' : (cargoVal.toLowerCase().includes('admin') || userToApprove.login.toLowerCase() === 'admin' ? 'admin' : 'admin');
    
    const updatedUsers = users.map(u => {
      if ((u.login || '').trim().toLowerCase() === (userToApprove.login || '').trim().toLowerCase()) {
        return {
          ...u,
          approved: true,
          status: 'ATIVO' as const,
          cargo: cargoVal,
          role: roleVal as any,
          permissions: isCorretor ? { ...CORRETOR_PERMISSIONS } : (u.permissions || DEFAULT_PERMISSIONS)
        };
      }
      return u;
    });

    onUpdateUsers(updatedUsers);
    setSaveSuccessMsg(`Usuário "${userToApprove.login}" aprovado com sucesso como "${cargoVal}"! Acesso liberado.`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Approval handler for internal UserAccessRequest
  const handleApproveAccessRequest = async (req: UserAccessRequest) => {
    const cfg = requestConfigs[req.id] || {
      cargo: req.cargoSugerido || 'Analista Sênior',
      password: 'mplan' + Math.floor(1000 + Math.random() * 9000)
    };
    const cargoVal = cfg.cargo || req.cargoSugerido || 'Analista Sênior';
    const passwordVal = cfg.password || '123456';
    const isCorretor = cargoVal.toLowerCase().includes('corretor');
    const roleVal = isCorretor ? 'corretor' : 'admin';
    const permissions = isCorretor ? { ...CORRETOR_PERMISSIONS } : { ...DEFAULT_PERMISSIONS };

    setProcessingRequestId(req.id);

    try {
      // 1. Criar usuário no Supabase Auth + profiles + users
      const authResult = await createAuthUserByAdmin({
        email: req.email.trim(),
        password: passwordVal.trim(),
        login: req.nome.trim(),
        name: req.nome.trim(),
        cargo: cargoVal,
        role: roleVal,
        permissions: permissions
      });

      // 2. Atualizar o registro da solicitação de acesso
      await updateUserAccessRequest(req.id, {
        status: 'APROVADO',
        aprovadoPor: currentUser?.login || 'Administrador',
        aprovadoEm: new Date().toISOString()
      });

      // 3. Adicionar/Atualizar na lista de usuários do sistema
      const newUser: User = {
        id: authResult.authUserId || `usr_${Date.now()}`,
        login: req.nome.trim(),
        email: req.email.trim(),
        senha: passwordVal.trim(),
        cargo: cargoVal,
        role: roleVal as any,
        status: 'ATIVO',
        ultimoAcesso: 'Hoje\n10:00',
        approved: true,
        permissions: permissions
      };

      const existingIdx = users.findIndex(u => 
        (u.email || '').trim().toLowerCase() === req.email.trim().toLowerCase() ||
        (u.login || '').trim().toLowerCase() === req.nome.trim().toLowerCase()
      );

      let updatedUsers: User[];
      if (existingIdx >= 0) {
        updatedUsers = [...users];
        updatedUsers[existingIdx] = { ...users[existingIdx], ...newUser };
      } else {
        updatedUsers = [...users, newUser];
      }

      await onUpdateUsers(updatedUsers);
      await loadRequests();

      setGlobalNotification({
        type: 'success',
        title: 'Solicitação Aprovada com Sucesso!',
        message: `O colaborador "${req.nome}" teve seu acesso liberado com o cargo "${cargoVal}".`,
        details: `Credenciais de acesso: E-mail: ${req.email} | Senha: ${passwordVal}`
      });
      setSaveSuccessMsg(`Acesso de "${req.nome}" aprovado e liberado com sucesso!`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Erro ao aprovar solicitação:', err);
      setGlobalNotification({
        type: 'error',
        title: 'Erro ao aprovar solicitação',
        message: err?.message || 'Falha ao provisionar credencial no banco de dados.'
      });
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Rejection handler for internal UserAccessRequest
  const handleConfirmRejectAccessRequest = async () => {
    if (!rejectModalData.request) return;
    const req = rejectModalData.request;
    setProcessingRequestId(req.id);

    try {
      await updateUserAccessRequest(req.id, {
        status: 'RECUSADO',
        aprovadoPor: currentUser?.login || 'Administrador',
        aprovadoEm: new Date().toISOString(),
        motivoRecusa: rejectModalData.reason.trim() || 'Solicitação não autorizada pela administração.'
      });

      await loadRequests();

      setGlobalNotification({
        type: 'warning',
        title: 'Solicitação Recusada',
        message: `A solicitação de "${req.nome}" (${req.email}) foi marcada como RECUSADA.`
      });
      setSaveSuccessMsg(`Solicitação de "${req.nome}" recusada.`);
      setTimeout(() => setSaveSuccessMsg(null), 3500);
      setRejectModalData({ open: false, request: null, reason: '' });
    } catch (err: any) {
      console.error('Erro ao recusar solicitação:', err);
      alert('Erro ao registrar recusa: ' + err.message);
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectPendingUser = (userToReject: User) => {
    const confirmReject = window.confirm(`Deseja recusar e remover a solicitação de acesso do usuário "${userToReject.login}"?`);
    if (!confirmReject) return;

    const updatedUsers = users.filter(u => (u.login || '').trim().toLowerCase() !== (userToReject.login || '').trim().toLowerCase());
    onUpdateUsers(updatedUsers);
    setSaveSuccessMsg(`Solicitação de "${userToReject.login}" foi recusada.`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handleApproveAllPending = () => {
    if (pendingUsers.length === 0) return;
    const updatedUsers = users.map(u => {
      if (u.approved === false || (u as any).approved === 'false') {
        const cargoVal = pendingCargos[u.login] || u.cargo || 'Analista Sênior';
        const isCorretor = cargoVal.toLowerCase().includes('corretor');
        return {
          ...u,
          approved: true,
          status: 'ATIVO' as const,
          cargo: cargoVal,
          role: (isCorretor ? 'corretor' : 'admin') as any,
          permissions: isCorretor ? { ...CORRETOR_PERMISSIONS } : (u.permissions || DEFAULT_PERMISSIONS)
        };
      }
      return u;
    });

    onUpdateUsers(updatedUsers);
    setSaveSuccessMsg(`Todas as ${pendingUsers.length} solicitações foram aprovadas com sucesso!`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const getInitials = (login: string) => {
    if (!login) return 'US';
    const parts = login.split(/[\.\_\s]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return login.slice(0, 2).toUpperCase();
  };

  const getAvatarBg = (login: string, cargo?: string) => {
    const l = login.toLowerCase();
    const c = (cargo || '').toLowerCase();
    if (c.includes('corretor')) return 'bg-amber-600 text-white';
    if (l.includes('gestor') || c.includes('gestor')) return 'bg-purple-600 text-white';
    if (l === 'admin' || l === 'admin2' || c.includes('gerente')) return 'bg-blue-600 text-white';
    return 'bg-[#1d4ed8] text-white';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* SCREEN TITLE & SEARCH BAR HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#001a54] tracking-tight">
            Gestão de Credenciais
          </h2>
          <p className="text-xs font-medium text-gray-500 mt-1">
            Gerenciamento de usuários do sistema, perfis e matriz de permissões de acesso.
          </p>
        </div>

        {/* SEARCH INPUT */}
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar usuário por nome ou email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200/90 rounded-full text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#001a54] focus:ring-1 focus:ring-[#001a54] shadow-xs transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>
      </div>

      {/* GLOBAL NOTIFICATION BANNER */}
      {globalNotification && (
        <div className={`p-4 rounded-2xl border flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm ${
          globalNotification.type === 'error'
            ? 'bg-red-50/90 border-red-200 text-red-900'
            : globalNotification.type === 'warning'
            ? 'bg-amber-50/90 border-amber-200 text-amber-900'
            : 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-start gap-3">
            <span className={`material-symbols-outlined text-xl mt-0.5 ${
              globalNotification.type === 'error' ? 'text-red-600' : globalNotification.type === 'warning' ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              {globalNotification.type === 'error' ? 'error' : globalNotification.type === 'warning' ? 'warning' : 'check_circle'}
            </span>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider">{globalNotification.title}</h4>
              <p className="text-xs font-medium mt-0.5">{globalNotification.message}</p>
              {globalNotification.details && (
                <p className="text-[11px] opacity-80 mt-1 font-mono bg-black/5 p-1.5 rounded-lg">{globalNotification.details}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setGlobalNotification(null)}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-black/5 transition-all cursor-pointer shrink-0"
            title="Fechar aviso"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* SUB-TABS NAVIGATION BAR */}
      <div className="flex items-center gap-2 border-b border-gray-200/90 bg-white/70 backdrop-blur-xs p-1.5 rounded-2xl shadow-xs">
        <button
          onClick={() => setActiveCredTab('usuarios')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
            activeCredTab === 'usuarios'
              ? 'bg-[#001a54] text-white shadow-xs'
              : 'text-gray-600 hover:text-[#001a54] hover:bg-gray-100/70'
          }`}
        >
          <span className="material-symbols-outlined text-base">group</span>
          <span>Usuários do Sistema</span>
          <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeCredTab === 'usuarios' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
          }`}>
            {activeUsers.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveCredTab('aprovacoes');
            loadRequests();
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer relative ${
            activeCredTab === 'aprovacoes'
              ? 'bg-[#e85d04] text-white shadow-xs'
              : 'text-gray-600 hover:text-[#e85d04] hover:bg-orange-50/60'
          }`}
        >
          <span className="material-symbols-outlined text-base">how_to_reg</span>
          <span>Aprovação de Solicitações de Acesso</span>
          {(accessRequests.filter(r => r.status === 'PENDENTE').length + pendingUsers.length) > 0 ? (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-white text-[#e85d04] animate-pulse">
              {accessRequests.filter(r => r.status === 'PENDENTE').length + pendingUsers.length} pendente{(accessRequests.filter(r => r.status === 'PENDENTE').length + pendingUsers.length) > 1 ? 's' : ''}
            </span>
          ) : (
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeCredTab === 'aprovacoes' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {accessRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 2: APROVAÇÃO & SOLICITAÇÕES DE NOVOS USUÁRIOS */}
      {activeCredTab === 'aprovacoes' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* TOP APPROVALS BANNER / CONTROLS */}
          <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-white border border-orange-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#e85d04] text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                <span className="material-symbols-outlined text-2xl">verified_user</span>
              </div>
              <div>
                <h3 className="text-base font-black text-[#001a54] tracking-tight">
                  Central de Liberação e Aprovação de Acesso
                </h3>
                <p className="text-xs text-gray-600 font-medium mt-0.5">
                  Gerencie as solicitações internas de novos usuários submetidas por colaboradores e autorize o acesso ao sistema.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                onClick={() => setIsRequestModalOpen(true)}
                className="bg-[#001a54] hover:bg-[#001138] text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">person_add</span>
                <span>+ Solicitar Novo Usuário</span>
              </button>

              <button
                onClick={loadRequests}
                disabled={isLoadingRequests}
                className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-extrabold px-3 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Recarregar solicitações"
              >
                <span className={`material-symbols-outlined text-base ${isLoadingRequests ? 'animate-spin text-orange-600' : ''}`}>refresh</span>
                <span className="hidden sm:inline">Atualizar</span>
              </button>

              {pendingUsers.length > 0 && (
                <button
                  onClick={handleApproveAllPending}
                  className="bg-[#16a34a] hover:bg-green-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">done_all</span>
                  <span>Aprovar Pendentes Legados ({pendingUsers.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* FILTER TABS & SEARCH BAR */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {(['PENDENTE', 'APROVADO', 'RECUSADO', 'TODOS'] as const).map(tabKey => {
                const count = tabKey === 'PENDENTE'
                  ? accessRequests.filter(r => r.status === 'PENDENTE').length + pendingUsers.length
                  : tabKey === 'APROVADO'
                  ? accessRequests.filter(r => r.status === 'APROVADO').length
                  : tabKey === 'RECUSADO'
                  ? accessRequests.filter(r => r.status === 'RECUSADO').length
                  : accessRequests.length + pendingUsers.length;

                const label = tabKey === 'PENDENTE' ? 'Pendentes' : tabKey === 'APROVADO' ? 'Aprovadas' : tabKey === 'RECUSADO' ? 'Recusadas' : 'Todas';

                return (
                  <button
                    key={tabKey}
                    onClick={() => setRequestFilter(tabKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      requestFilter === tabKey
                        ? 'bg-[#001a54] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      requestFilter === tabKey ? 'bg-white/20 text-white' : 'bg-white text-gray-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
              <input
                type="text"
                placeholder="Buscar solicitação..."
                value={requestSearchTerm}
                onChange={e => setRequestSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:bg-white focus:outline-none focus:border-[#001a54]"
              />
            </div>
          </div>

          {/* LIST OF INTERNAL ACCESS REQUESTS */}
          {(() => {
            const filteredReqs = accessRequests.filter(r => {
              const matchStatus = requestFilter === 'TODOS' || r.status === requestFilter;
              if (!matchStatus) return false;
              if (!requestSearchTerm.trim()) return true;
              const t = requestSearchTerm.toLowerCase();
              return (
                (r.nome || '').toLowerCase().includes(t) ||
                (r.email || '').toLowerCase().includes(t) ||
                (r.cargoSugerido || '').toLowerCase().includes(t) ||
                (r.solicitanteNome || '').toLowerCase().includes(t) ||
                (r.justificativa || '').toLowerCase().includes(t)
              );
            });

            const showLegacyPending = (requestFilter === 'PENDENTE' || requestFilter === 'TODOS') && pendingUsers.length > 0;

            if (filteredReqs.length === 0 && !showLegacyPending) {
              return (
                <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center shadow-xs space-y-4">
                  <div className="w-16 h-16 rounded-full bg-orange-50 text-[#e85d04] flex items-center justify-center mx-auto shadow-xs">
                    <span className="material-symbols-outlined text-3xl">inbox</span>
                  </div>
                  <div className="max-w-md mx-auto">
                    <h4 className="text-base font-black text-[#001a54]">
                      Nenhuma solicitação encontrada
                    </h4>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                      {requestFilter === 'PENDENTE'
                        ? 'Não há solicitações de acesso pendentes de aprovação no momento.'
                        : 'Não há registros para o filtro selecionado.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsRequestModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#001a54] text-white text-xs font-bold rounded-xl hover:bg-[#001138] transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">person_add</span>
                    <span>Criar Nova Solicitação Interna</span>
                  </button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredReqs.map(req => {
                  const cfg = requestConfigs[req.id] || {
                    cargo: req.cargoSugerido || 'Analista Sênior',
                    password: 'mplan' + Math.floor(1000 + Math.random() * 9000)
                  };
                  const isPending = req.status === 'PENDENTE';
                  const isApproved = req.status === 'APROVADO';
                  const isRefused = req.status === 'RECUSADO';
                  const isProcessing = processingRequestId === req.id;
                  const isCorretor = (cfg.cargo || '').toLowerCase().includes('corretor');

                  return (
                    <div
                      key={req.id}
                      className={`bg-white rounded-2xl border-2 p-5 shadow-xs space-y-4 transition-all relative overflow-hidden flex flex-col justify-between ${
                        isPending
                          ? 'border-orange-200 hover:border-orange-400'
                          : isApproved
                          ? 'border-emerald-200 bg-emerald-50/10'
                          : 'border-rose-200 bg-rose-50/10'
                      }`}
                    >
                      {/* STATUS BADGE */}
                      <div className={`absolute top-0 right-0 text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider flex items-center gap-1 ${
                        isPending
                          ? 'bg-[#e85d04]'
                          : isApproved
                          ? 'bg-emerald-600'
                          : 'bg-rose-600'
                      }`}>
                        <span className="material-symbols-outlined text-[11px]">
                          {isPending ? 'hourglass_top' : isApproved ? 'check_circle' : 'cancel'}
                        </span>
                        {isPending ? 'Aguardando Admin' : isApproved ? 'Acesso Aprovado' : 'Solicitação Recusada'}
                      </div>

                      <div className="space-y-3.5">
                        {/* HEADER: USER INFO */}
                        <div className="flex items-start gap-3.5 pr-32">
                          <div className={`w-12 h-12 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 shadow-xs ${getAvatarBg(req.nome, cfg.cargo)}`}>
                            {getInitials(req.nome)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-base font-black text-[#001a54] truncate">
                              {req.nome}
                            </h4>
                            <p className="text-xs font-semibold text-gray-600 truncate mt-0.5">
                              {req.email}
                            </p>
                            {req.telefone && (
                              <p className="text-[11px] font-medium text-gray-500 mt-0.5 flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs text-gray-400">call</span>
                                {req.telefone}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* SOLICITANTE AUDIT LINE */}
                        <div className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs flex items-center gap-2">
                          <span className="material-symbols-outlined text-slate-400 text-sm">badge</span>
                          <div className="truncate text-slate-700">
                            <span className="text-slate-500">Solicitado internamente por: </span>
                            <strong className="text-[#001a54] font-bold">{req.solicitanteNome || req.solicitanteLogin || 'Colaborador'}</strong>
                            {req.solicitanteEmail ? ` (${req.solicitanteEmail})` : ''}
                            <span className="text-slate-400 text-[10px] ml-1">
                              • {new Date(req.createdAt).toLocaleDateString('pt-BR')} às {new Date(req.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        {/* JUSTIFICATIVA BOX */}
                        {req.justificativa && (
                          <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-1">
                            <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">format_quote</span>
                              Justificativa do Pedido:
                            </span>
                            <p className="text-xs text-amber-950 font-medium leading-relaxed italic">
                              "{req.justificativa}"
                            </p>
                          </div>
                        )}

                        {/* IF PENDING: CONFIGURATION CONTROLS */}
                        {isPending && (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                            <div>
                              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                                Atribuir Função / Cargo no Sistema:
                              </label>
                              <select
                                value={cfg.cargo}
                                onChange={e => {
                                  const newCargo = e.target.value;
                                  setRequestConfigs(prev => ({
                                    ...prev,
                                    [req.id]: {
                                      cargo: newCargo,
                                      password: cfg.password
                                    }
                                  }));
                                }}
                                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:border-[#001a54]"
                              >
                                {CARGO_OPTIONS.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                                  Senha Temporária:
                                </label>
                                <input
                                  type="text"
                                  value={cfg.password}
                                  onChange={e => {
                                    const newPwd = e.target.value;
                                    setRequestConfigs(prev => ({
                                      ...prev,
                                      [req.id]: {
                                        cargo: cfg.cargo,
                                        password: newPwd
                                      }
                                    }));
                                  }}
                                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold text-gray-800 focus:outline-none focus:border-[#001a54]"
                                  placeholder="Senha inicial"
                                />
                              </div>

                              <div className="flex flex-col justify-end">
                                <span className="text-[10px] font-bold text-slate-500 mb-1">Tipo de Acesso:</span>
                                {isCorretor ? (
                                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-1.5 rounded-lg">
                                    <span className="material-symbols-outlined text-xs">smartphone</span>
                                    Portal do Corretor
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-1.5 rounded-lg">
                                    <span className="material-symbols-outlined text-xs">admin_panel_settings</span>
                                    Painel Financeiro
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* IF APPROVED INFO */}
                        {isApproved && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
                            <span className="material-symbols-outlined text-emerald-600 text-base mt-0.5">verified</span>
                            <div>
                              <p className="font-bold">Acesso Aprovado e Credencial Criada</p>
                              <p className="text-[11px] text-emerald-800 mt-0.5">
                                Aprovado por <strong className="font-bold">{req.aprovadoPor || 'Admin'}</strong>
                                {req.aprovadoEm ? ` em ${new Date(req.aprovadoEm).toLocaleDateString('pt-BR')} às ${new Date(req.aprovadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* IF REFUSED INFO */}
                        {isRefused && (
                          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
                            <span className="material-symbols-outlined text-rose-600 text-base mt-0.5">cancel</span>
                            <div>
                              <p className="font-bold">Solicitação Recusada</p>
                              <p className="text-[11px] text-rose-800 mt-0.5">
                                Recusada por <strong className="font-bold">{req.aprovadoPor || 'Admin'}</strong>
                                {req.aprovadoEm ? ` em ${new Date(req.aprovadoEm).toLocaleDateString('pt-BR')}` : ''}.
                              </p>
                              {req.motivoRecusa && (
                                <p className="text-[11px] text-rose-900 mt-1 italic">
                                  Motivo: "{req.motivoRecusa}"
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* BOTTOM ACTIONS (FOR PENDING) */}
                      {isPending && (
                        <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100 mt-2">
                          <button
                            onClick={() => setRejectModalData({ open: true, request: req, reason: '' })}
                            disabled={isProcessing}
                            className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                            <span>Recusar</span>
                          </button>

                          <button
                            onClick={() => handleApproveAccessRequest(req)}
                            disabled={isProcessing}
                            className="px-5 py-2.5 bg-[#16a34a] hover:bg-green-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <>
                                <span className="material-symbols-outlined text-base animate-spin">refresh</span>
                                <span>Criando Credencial...</span>
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-base">check_circle</span>
                                <span>Aprovar & Criar Credencial</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* LEGACY PENDING USERS */}
                {showLegacyPending && pendingUsers.map(pu => {
                  const selectedCargo = pendingCargos[pu.login] || pu.cargo || 'Analista Sênior';
                  const isCorretor = selectedCargo.toLowerCase().includes('corretor');

                  return (
                    <div
                      key={pu.login}
                      className="bg-white rounded-2xl border-2 border-orange-200 p-5 shadow-xs space-y-4 hover:border-orange-400 transition-all relative overflow-hidden flex flex-col justify-between"
                    >
                      <div className="absolute top-0 right-0 bg-[#e85d04] text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-[11px]">hourglass_top</span>
                        Pendente Legado
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3.5 pr-32">
                          <div className={`w-11 h-11 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 shadow-xs ${getAvatarBg(pu.login, selectedCargo)}`}>
                            {getInitials(pu.login)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-extrabold text-[#001a54] truncate">
                              {pu.login}
                            </h4>
                            <p className="text-xs font-medium text-gray-500 truncate mt-0.5">
                              {pu.email || 'E-mail não informado'}
                            </p>
                          </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                            Atribuir Função / Cargo no Acesso:
                          </label>
                          <select
                            value={selectedCargo}
                            onChange={e => setPendingCargos(prev => ({ ...prev, [pu.login]: e.target.value }))}
                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:border-[#001a54]"
                          >
                            {CARGO_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => handleRejectPendingUser(pu)}
                          className="px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                          <span>Recusar</span>
                        </button>

                        <button
                          onClick={() => handleApprovePendingUser(pu, selectedCargo)}
                          className="px-5 py-2.5 bg-[#16a34a] hover:bg-green-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <span className="material-symbols-outlined text-base">check_circle</span>
                          <span>Aprovar & Liberar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 1: USUÁRIOS DO SISTEMA (SPLIT LAYOUT) */}
      {activeCredTab === 'usuarios' && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL: USUÁRIOS DO SISTEMA */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4 flex flex-col justify-between min-h-[560px]">
          <div>
            {/* CARD HEADER */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#001a54] text-xl">group</span>
                <h3 className="text-base font-extrabold text-[#001a54] tracking-tight">Usuários do Sistema</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRequestModalOpen(true)}
                  className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-extrabold px-3 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  title="Solicitar cadastro interno de novo usuário"
                >
                  <span className="material-symbols-outlined text-sm text-amber-700">person_add</span>
                  <span>Solicitar Usuário</span>
                </button>

                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-[#001a54] hover:bg-[#001138] text-white text-xs font-extrabold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  <span>Novo Usuário</span>
                </button>
              </div>
            </div>

            {/* USERS TABLE */}
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="py-3 px-3">USUÁRIO</th>
                    <th className="py-3 px-3">FUNÇÃO</th>
                    <th className="py-3 px-3 text-center">STATUS</th>
                    <th className="py-3 px-3 text-right">ÚLTIMO ACESSO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(u => {
                      const isSelected = selectedUser?.login === u.login;
                      const statusIsActive = u.status !== 'INATIVO' && u.approved !== false;
                      const cargoLabel = u.cargo || (u.login.toLowerCase() === 'admin' ? 'Gerente Financeiro' : 'Analista Sênior');
                      const isMasterAdmin = u.login.toLowerCase() === 'admin';

                      return (
                        <tr
                          key={u.login}
                          onClick={() => handleSelectUser(u)}
                          className={`cursor-pointer transition-colors relative ${
                            isSelected
                              ? 'bg-blue-50/60 border-l-4 border-l-[#001a54]'
                              : 'hover:bg-gray-50/80 border-l-4 border-l-transparent'
                          }`}
                        >
                          {/* USER NAME & EMAIL */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs ${getAvatarBg(u.login, u.cargo)}`}>
                                {getInitials(u.login)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-bold text-gray-900 truncate">{u.login}</p>
                                  {isMasterAdmin && (
                                    <span className="bg-blue-100 text-[#001a54] text-[9px] font-extrabold px-1.5 py-0.2 rounded font-mono uppercase tracking-wider">
                                      MASTER
                                    </span>
                                  )}
                                  {u.cargo?.toLowerCase().includes('corretor') && (
                                    <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded font-mono uppercase tracking-wider flex items-center gap-0.5">
                                      <span className="material-symbols-outlined text-[10px]">smartphone</span>
                                      CORRETOR
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] font-medium text-gray-400 truncate mt-0.5">
                                  {u.email || `${u.login.toLowerCase().replace(/\s+/g, '.')}@multiplan.com`}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* FUNÇÃO / CARGO - INTERACTIVE SELECTOR & ACTIONS */}
                          <td className="py-3.5 px-3 text-xs font-semibold text-gray-700" onClick={e => e.stopPropagation()}>
                            <div className="relative inline-flex items-center group">
                              <select
                                value={u.cargo || (isMasterAdmin ? 'Gerente Geral & Financeiro' : 'Analista Sênior')}
                                onChange={e => handleChangeCargo(u, e.target.value)}
                                className={`text-xs font-bold py-1.5 px-2.5 rounded-xl border transition-all cursor-pointer outline-none ${
                                  (u.cargo || '').toLowerCase().includes('corretor')
                                    ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                                    : (u.cargo || '').toLowerCase().includes('gerente') || isMasterAdmin
                                    ? 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                                }`}
                                title="Clique para alterar a Função do Usuário"
                              >
                                {CARGO_OPTIONS.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                              <div className="flex items-center gap-1 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditUserModal(u)}
                                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                                  title="Editar dados completos deste usuário"
                                >
                                  <span className="material-symbols-outlined text-sm">edit</span>
                                </button>
                                {!isMasterAdmin && (
                                  <button
                                    type="button"
                                    onClick={e => handleDeleteUser(u, e)}
                                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                    title="Excluir usuário"
                                  >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* STATUS BADGE (CLICKABLE TOGGLE) */}
                          <td className="py-3.5 px-3 text-center" onClick={e => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={e => handleToggleUserStatus(u, e)}
                              disabled={isMasterAdmin}
                              title={isMasterAdmin ? 'Administrador Master não pode ser inativado' : `Clique para alternar para ${statusIsActive ? 'Inativo' : 'Ativo'}`}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border transition-all cursor-pointer select-none active:scale-95 ${
                                isMasterAdmin
                                  ? 'bg-blue-50 text-blue-700 border-blue-200 cursor-default'
                                  : statusIsActive
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80 hover:bg-emerald-100 hover:border-emerald-300 shadow-2xs'
                                  : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 hover:border-rose-300'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isMasterAdmin ? 'bg-blue-500' : statusIsActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                              <span>{statusIsActive ? 'Ativo' : 'Inativo'}</span>
                            </button>
                          </td>

                          {/* ÚLTIMO ACESSO */}
                          <td className="py-3.5 px-3 text-right">
                            <div className="text-[11px] font-medium text-gray-500 leading-tight">
                              <div>{u.ultimoAcesso?.split('\n')[0] || u.ultimoAcesso?.split(',')[0] || 'Hoje'}</div>
                              <div className="text-gray-400 text-[10px]">{u.ultimoAcesso?.split('\n')[1] || u.ultimoAcesso?.split(',')[1] || '10:00'}</div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-400 text-xs font-semibold">
                        Nenhum usuário encontrado para "{searchTerm}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* LEFT CARD FOOTER */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-medium">
            <span>Exibindo <strong>{filteredUsers.length}</strong> usuário(s)</span>
            <span>Clique na <strong>Função</strong> para alterar ou na linha para ver permissões</span>
          </div>
        </div>

        {/* RIGHT PANEL: PERMISSÕES DE ACESSO */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex flex-col justify-between min-h-[560px]">
          <div className="space-y-5">
            {/* RIGHT CARD HEADER */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#001a54] text-xl">shield</span>
                <h3 className="text-base font-extrabold text-[#001a54] tracking-tight">Permissões e Função</h3>
              </div>

              {selectedUser && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleUserStatus(selectedUser)}
                    disabled={selectedUser.login.toLowerCase() === 'admin'}
                    title={selectedUser.login.toLowerCase() === 'admin' ? 'Administrador Master sempre ativo' : `Clique para marcar como ${selectedUser.status === 'INATIVO' ? 'Ativo' : 'Inativo'}`}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      selectedUser.login.toLowerCase() === 'admin'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 cursor-default'
                        : selectedUser.status !== 'INATIVO'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer shadow-2xs'
                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 cursor-pointer'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${selectedUser.login.toLowerCase() === 'admin' ? 'bg-blue-500' : selectedUser.status !== 'INATIVO' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    <span>{selectedUser.login.toLowerCase() === 'admin' ? 'Ativo' : selectedUser.status !== 'INATIVO' ? 'Ativo' : 'Inativo'}</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditUserModal(selectedUser)}
                    className="p-1.5 text-xs text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 flex items-center gap-1 font-bold transition-colors cursor-pointer"
                    title="Editar dados e senha"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    <span>Editar</span>
                  </button>
                  <span className="bg-blue-100/70 text-[#001a54] text-xs font-extrabold px-3 py-1.5 rounded-xl border border-blue-200/60 shadow-2xs">
                    {selectedUser.login}
                  </span>
                </div>
              )}
            </div>

            {saveSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {selectedUser ? (
              <div className="space-y-5">
                {/* FUNÇÃO / CARGO FIELD ON RIGHT PANEL */}
                <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-extrabold text-[#001a54] uppercase tracking-wider">
                      Função da Pessoa:
                    </label>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                      selectedUserCargo.toLowerCase().includes('corretor')
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedUserCargo.toLowerCase().includes('corretor') ? 'Acesso Mobile / Corretor' : 'Acesso Desktop / Gestor'}
                    </span>
                  </div>

                  <select
                    value={selectedUserCargo}
                    onChange={e => {
                      const newC = e.target.value;
                      setSelectedUserCargo(newC);
                      handleChangeCargo(selectedUser, newC);
                    }}
                    className="w-full p-2.5 text-xs font-bold text-[#001a54] bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  >
                    {CARGO_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>

                  {selectedUserCargo.toLowerCase().includes('corretor') ? (
                    <div className="p-2 bg-amber-50/80 border border-amber-200/60 rounded-xl text-[11px] text-amber-900 font-medium flex items-start gap-2">
                      <span className="material-symbols-outlined text-amber-600 text-base shrink-0 mt-0.5">smartphone</span>
                      <span>
                        <strong>Modo Corretor Ativo:</strong> Este usuário terá acesso focado ao <strong>Portal do Corretor (Mobile/Web)</strong> para cotações, envio de propostas e consulta de comissões, sem acesso aos módulos de gestão administrativa.
                      </span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 font-medium">
                      Este usuário acessa a plataforma gerencial com base nas permissões marcadas abaixo:
                    </p>
                  )}
                </div>
                
                {/* 1. DASHBOARD & INDICADORES */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
                    <span className="material-symbols-outlined text-sm text-[#001a54]">grid_view</span>
                    <span>DASHBOARD & INDICADORES</span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-1">
                    <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 cursor-pointer select-none hover:text-gray-900">
                      <input
                        type="checkbox"
                        checked={!!editingPermissions.dashboard}
                        onChange={() => handleToggleEditingPermission('dashboard')}
                        className="w-4 h-4 text-[#001a54] rounded focus:ring-[#001a54] border-gray-300"
                      />
                      <span>Visualizar Dashboard</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 cursor-pointer select-none hover:text-gray-900">
                      <input
                        type="checkbox"
                        checked={!!editingPermissions.exportarDados}
                        onChange={() => handleToggleEditingPermission('exportarDados')}
                        className="w-4 h-4 text-[#001a54] rounded focus:ring-[#001a54] border-gray-300"
                      />
                      <span>Exportar Dados / Relatórios</span>
                    </label>
                  </div>
                </div>

                {/* 2. PROPOSTAS & CONTRATOS (COMERCIAL) */}
                <div className="space-y-2.5 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
                    <span className="material-symbols-outlined text-sm text-[#001a54]">description</span>
                    <span>PROPOSTAS & CONTRATOS</span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-1">
                    <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 cursor-pointer select-none hover:text-gray-900">
                      <input
                        type="checkbox"
                        checked={!!editingPermissions.propostas}
                        onChange={() => handleToggleEditingPermission('propostas')}
                        className="w-4 h-4 text-[#001a54] rounded focus:ring-[#001a54] border-gray-300"
                      />
                      <span>Visualizar Propostas</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 cursor-pointer select-none hover:text-gray-900">
                      <input
                        type="checkbox"
                        checked={!!editingPermissions.criarPropostas}
                        onChange={() => handleToggleEditingPermission('criarPropostas')}
                        className="w-4 h-4 text-[#001a54] rounded focus:ring-[#001a54] border-gray-300"
                      />
                      <span>Criar / Editar Propostas</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 cursor-pointer select-none hover:text-gray-900">
                      <input
                        type="checkbox"
                        checked={!!editingPermissions.cotacao}
                        onChange={() => handleToggleEditingPermission('cotacao')}
                        className="w-4 h-4 text-[#001a54] rounded focus:ring-[#001a54] border-gray-300"
                      />
                      <span>Cotação de Planos</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 cursor-pointer select-none hover:text-gray-900">
                      <input
                        type="checkbox"
                        checked={!!editingPermissions.estruturaProposta}
                        onChange={() => handleToggleEditingPermission('estruturaProposta')}
                        className="w-4 h-4 text-[#001a54] rounded focus:ring-[#001a54] border-gray-300"
                      />
                      <span>Estrutura de Proposta</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 cursor-pointer select-none hover:text-gray-900">
                      <input
                        type="checkbox"
                        checked={!!editingPermissions.gestaoDemandas}
                        onChange={() => handleToggleEditingPermission('gestaoDemandas')}
                        className="w-4 h-4 text-[#001a54] rounded focus:ring-[#001a54] border-gray-300"
                      />
                      <span>Acompanhamento</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 cursor-pointer select-none hover:text-gray-900">
                      <input
                        type="checkbox"
                        checked={!!editingPermissions.comissoes}
                        onChange={() => handleToggleEditingPermission('comissoes')}
                        className="w-4 h-4 text-[#001a54] rounded focus:ring-[#001a54] border-gray-300"
                      />
                      <span>Gestão de Comissões</span>
                    </label>
                  </div>
                </div>

                {/* 3. FINANCEIRO & REPASSES */}
                <div className="space-y-2.5 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
                    <span className="material-symbols-outlined text-sm text-[#001a54]">payments</span>
                    <span>FINANCEIRO & REPASSES</span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-1">
                    <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 cursor-pointer select-none hover:text-gray-900">
                      <input
                        type="checkbox"
                        checked={!!editingPermissions.financeiro}
                        onChange={() => handleToggleEditingPermission('financeiro')}
                        className="w-4 h-4 text-[#001a54] rounded focus:ring-[#001a54] border-gray-300"
                      />
                      <span>Lotes de Pagamento</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 cursor-pointer select-none hover:text-gray-900">
                      <input
                        type="checkbox"
                        checked={!!editingPermissions.contasPagar}
                        onChange={() => handleToggleEditingPermission('contasPagar')}
                        className="w-4 h-4 text-[#001a54] rounded focus:ring-[#001a54] border-gray-300"
                      />
                      <span>Contas a Pagar</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 cursor-pointer select-none hover:text-gray-900">
                      <input
                        type="checkbox"
                        checked={!!editingPermissions.contasReceber}
                        onChange={() => handleToggleEditingPermission('contasReceber')}
                        className="w-4 h-4 text-[#001a54] rounded focus:ring-[#001a54] border-gray-300"
                      />
                      <span>Contas a Receber</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 cursor-pointer select-none hover:text-gray-900">
                      <input
                        type="checkbox"
                        checked={!!editingPermissions.fluxoCaixa}
                        onChange={() => handleToggleEditingPermission('fluxoCaixa')}
                        className="w-4 h-4 text-[#001a54] rounded focus:ring-[#001a54] border-gray-300"
                      />
                      <span>Fluxo de Caixa</span>
                    </label>
                  </div>
                </div>

                {/* 4. GESTÃO & CONFIGURAÇÕES */}
                <div className="space-y-2.5 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
                    <span className="material-symbols-outlined text-sm text-[#001a54]">settings</span>
                    <span>GESTÃO & CONFIGURAÇÕES</span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-1 items-center">
                    <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 cursor-pointer select-none hover:text-gray-900">
                      <input
                        type="checkbox"
                        checked={!!editingPermissions.centroCusto}
                        onChange={() => handleToggleEditingPermission('centroCusto')}
                        className="w-4 h-4 text-[#001a54] rounded focus:ring-[#001a54] border-gray-300"
                      />
                      <span>Centro de Custo</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 cursor-pointer select-none hover:text-gray-900">
                      <input
                        type="checkbox"
                        checked={!!editingPermissions.detalhes}
                        onChange={() => handleToggleEditingPermission('detalhes')}
                        className="w-4 h-4 text-[#001a54] rounded focus:ring-[#001a54] border-gray-300"
                      />
                      <span>Relatórios</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 cursor-pointer select-none hover:text-gray-900">
                      <input
                        type="checkbox"
                        checked={!!editingPermissions.rh}
                        onChange={() => handleToggleEditingPermission('rh')}
                        className="w-4 h-4 text-[#001a54] rounded focus:ring-[#001a54] border-gray-300"
                      />
                      <span className="font-bold text-[#001a54]">Módulo de Recursos Humanos (RH)</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 cursor-pointer select-none hover:text-gray-900">
                      <input
                        type="checkbox"
                        checked={editingPermissions.notificacoes !== false}
                        onChange={() => handleToggleEditingPermission('notificacoes')}
                        className="w-4 h-4 text-[#001a54] rounded focus:ring-[#001a54] border-gray-300"
                      />
                      <span>Configurações de Notificações (WhatsApp)</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 cursor-pointer select-none hover:text-gray-900">
                      <input
                        type="checkbox"
                        checked={!!editingPermissions.planCredencias}
                        disabled={selectedUser.login.toLowerCase() === 'admin'}
                        onChange={() => handleToggleEditingPermission('planCredencias')}
                        className="w-4 h-4 text-[#001a54] rounded focus:ring-[#001a54] border-gray-300 disabled:opacity-50"
                      />
                      <span>Gerir Usuários / Credenciais</span>
                    </label>

                    {/* RED ACTION: EXCLUIR USUÁRIO */}
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(selectedUser)}
                      disabled={selectedUser.login.toLowerCase() === 'admin'}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed justify-start cursor-pointer"
                      title={selectedUser.login.toLowerCase() === 'admin' ? 'Usuário administrador master não pode ser excluído' : 'Excluir este usuário'}
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                      <span>Excluir Usuário</span>
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-12 text-center text-gray-400">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-40">person_search</span>
                <p className="text-xs font-bold">Selecione um usuário à esquerda para editar permissões</p>
              </div>
            )}
          </div>

          {/* ACTION BUTTONS FOOTER */}
          <div className="pt-4 mt-6 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              onClick={() => {
                if (selectedUser) {
                  setSelectedUserCargo(selectedUser.cargo || (selectedUser.login.toLowerCase() === 'admin' ? 'Gerente Geral & Financeiro' : 'Analista Sênior'));
                  setEditingPermissions(selectedUser.permissions || DEFAULT_PERMISSIONS);
                }
              }}
              className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              onClick={handleSavePermissions}
              className="px-6 py-2.5 text-xs font-extrabold text-white bg-[#e85d04] hover:bg-orange-600 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>

      </div>
      )}

      {/* MODAL: NOVO USUÁRIO */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <h3 className="text-base font-extrabold text-[#001a54] tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined">person_add</span>
                Cadastrar Novo Usuário
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              {addModalError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-start gap-2.5 animate-in fade-in duration-200">
                  <span className="material-symbols-outlined text-red-600 text-base mt-0.5 shrink-0">error</span>
                  <div className="flex-1">
                    <p className="font-bold text-red-900 mb-0.5">Não foi possível concluir o cadastro:</p>
                    <p>{addModalError}</p>
                  </div>
                  <button type="button" onClick={() => setAddModalError(null)} className="text-red-400 hover:text-red-700">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Login / Nome de Usuário *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Renan Rodrigues"
                    value={newLogin}
                    onChange={e => setNewLogin(e.target.value)}
                    className="w-full p-2.5 text-xs font-semibold border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-[#001a54]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    E-mail Corporativo *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="renan.rodrigues@multiplan.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full p-2.5 text-xs font-semibold border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-[#001a54]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Senha Inicial *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newSenha}
                    onChange={e => setNewSenha(e.target.value)}
                    className="w-full p-2.5 text-xs font-semibold border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-[#001a54]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Cargo / Função
                  </label>
                  <select
                    value={newCargo}
                    onChange={e => setNewCargo(e.target.value)}
                    className="w-full p-2.5 text-xs font-semibold border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-[#001a54]"
                  >
                    <option value="Analista Sênior">Analista Sênior</option>
                    <option value="Gerente Financeiro">Gerente Financeiro</option>
                    <option value="Corretor Sênior">Corretor Sênior</option>
                    <option value="Assistente Comercial">Assistente Comercial</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Status Inicial
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="userStatus"
                      checked={newStatus === 'ATIVO'}
                      onChange={() => setNewStatus('ATIVO')}
                      className="text-[#001a54]"
                    />
                    <span>Ativo</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="userStatus"
                      checked={newStatus === 'INATIVO'}
                      onChange={() => setNewStatus('INATIVO')}
                      className="text-[#001a54]"
                    />
                    <span>Inativo</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="px-5 py-2 bg-[#e85d04] text-white rounded-xl text-xs font-bold hover:bg-orange-600 shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isCreatingUser ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                      <span>Criando no Supabase...</span>
                    </>
                  ) : (
                    <span>Criar Usuário</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR DADOS DO USUÁRIO & FUNÇÃO */}
      {isEditUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <h3 className="text-base font-extrabold text-[#001a54] tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined">badge</span>
                Editar Usuário e Função: {editUserData.login}
              </h3>
              <button onClick={() => setIsEditUserModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEditUserModal} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Login do Usuário
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editUserData.login}
                    className="w-full p-2.5 text-xs font-bold border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    required
                    value={editUserData.email}
                    onChange={e => setEditUserData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-2.5 text-xs font-semibold border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-[#001a54]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Alterar Senha
                  </label>
                  <input
                    type="text"
                    placeholder="Deixe em branco para manter"
                    value={editUserData.senha}
                    onChange={e => setEditUserData(prev => ({ ...prev, senha: e.target.value }))}
                    className="w-full p-2.5 text-xs font-semibold border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-[#001a54]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Função da Pessoa (Cargo) *
                  </label>
                  <select
                    value={editUserData.cargo}
                    onChange={e => setEditUserData(prev => ({ ...prev, cargo: e.target.value }))}
                    className="w-full p-2.5 text-xs font-bold border border-blue-200 rounded-xl bg-blue-50/50 text-[#001a54] focus:outline-none focus:border-[#001a54]"
                  >
                    {CARGO_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {editUserData.cargo.toLowerCase().includes('corretor') && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-600 text-base">smartphone</span>
                  <span><strong>Acesso Corretor:</strong> Usuários com função Corretor acessam exclusivamente o Portal Mobile/Web de Vendas.</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Status da Conta
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="editUserStatus"
                      checked={editUserData.status === 'ATIVO'}
                      onChange={() => setEditUserData(prev => ({ ...prev, status: 'ATIVO' }))}
                      className="text-[#001a54]"
                    />
                    <span>Ativo</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="editUserStatus"
                      checked={editUserData.status === 'INATIVO'}
                      onChange={() => setEditUserData(prev => ({ ...prev, status: 'INATIVO' }))}
                      className="text-[#001a54]"
                    />
                    <span>Inativo</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div>
                  {editUserData.login.toLowerCase() !== 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = users.find(u => (u.login || '').trim().toLowerCase() === editUserData.login.trim().toLowerCase());
                        if (target) {
                          handleDeleteUser(target);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      <span>Excluir Usuário</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditUserModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#001a54] text-white rounded-xl text-xs font-bold hover:bg-[#001138] shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">check</span>
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR EXCLUSÃO DE USUÁRIO */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200 border-t-4 border-red-500">
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-3">
              <h3 className="text-base font-extrabold text-red-600 tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-xl">delete_forever</span>
                Confirmar Exclusão de Usuário
              </h3>
              <button 
                onClick={() => setUserToDelete(null)} 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 py-2">
              <p className="text-xs text-gray-600 leading-relaxed">
                Você tem certeza de que deseja excluir o usuário <strong className="text-gray-900 font-bold">{userToDelete.login}</strong>?
              </p>
              
              <div className="p-3 bg-red-50/70 border border-red-100 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-gray-700">
                  <span className="font-semibold text-gray-500">E-mail:</span>
                  <span className="font-bold">{userToDelete.email || 'Não informado'}</span>
                </div>
                <div className="flex items-center justify-between text-gray-700">
                  <span className="font-semibold text-gray-500">Função:</span>
                  <span className="font-bold">{userToDelete.cargo || 'Analista Sênior'}</span>
                </div>
                <div className="flex items-center justify-between text-gray-700">
                  <span className="font-semibold text-gray-500">Status atual:</span>
                  <span className={`font-bold ${userToDelete.status === 'INATIVO' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {userToDelete.status === 'INATIVO' ? 'Inativo' : 'Ativo'}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 italic">
                * Esta ação revoga permanentemente o acesso do usuário ao sistema.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                <span>Confirmar Exclusão</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECUSAR SOLICITAÇÃO DE ACESSO */}
      {rejectModalData.open && rejectModalData.request && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200 border-t-4 border-rose-500">
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-3">
              <h3 className="text-base font-extrabold text-rose-600 tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-xl">cancel</span>
                Recusar Solicitação de Acesso
              </h3>
              <button 
                onClick={() => setRejectModalData({ open: false, request: null, reason: '' })} 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 py-2">
              <p className="text-xs text-gray-600 leading-relaxed">
                Você está recusando a solicitação de acesso de <strong className="text-gray-900 font-bold">{rejectModalData.request.nome}</strong> ({rejectModalData.request.email}).
              </p>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                  Motivo da Recusa (opcional / justificativa):
                </label>
                <textarea
                  value={rejectModalData.reason}
                  onChange={e => setRejectModalData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Ex.: Função já preenchida ou dados divergentes."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-rose-500 min-h-[80px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
              <button
                type="button"
                onClick={() => setRejectModalData({ open: false, request: null, reason: '' })}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectAccessRequest}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">check</span>
                <span>Confirmar Recusa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SOLICITAR ACESSO INTERNO */}
      <ModalSolicitarAcesso
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        currentUser={currentUser}
        onSuccess={() => {
          loadRequests();
          setActiveCredTab('aprovacoes');
        }}
      />
    </div>
  );
};

export default CredentialsManager;
