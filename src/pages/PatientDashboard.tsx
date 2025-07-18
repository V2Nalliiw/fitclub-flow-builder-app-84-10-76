import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FileText, User, Calendar, Activity, ArrowRight, Workflow } from 'lucide-react';
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';
import { usePatientFlows } from '@/hooks/usePatientFlows';

const PatientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { hasAccess } = useRoleBasedAccess(['patient']);
  const { executions, loading: flowsLoading, refetch } = usePatientFlows();

  if (!hasAccess) {
    return null;
  }

  // Polling para verificar execuções disponíveis a cada 30 segundos
  React.useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 PatientDashboard: Verificando execuções disponíveis (polling)');
      refetch();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [refetch]);

  // Encontrar qualquer execução disponível para continuar
  const availableExecution = executions?.find(e => {
    const isInProgress = e.status === 'em-andamento';
    const hasCurrentStep = e.current_step && typeof e.current_step === 'object';
    const isNotCompleted = e.status !== 'concluido';
    const noDelayActive = !e.next_step_available_at || new Date(e.next_step_available_at) <= new Date();
    
    console.log(`🔍 Verificando execução ${e.id}:`, {
      status: e.status,
      hasCurrentStep,
      isNotCompleted,
      noDelayActive,
      nextStepAvailableAt: e.next_step_available_at
    });
    
    return isInProgress && hasCurrentStep && isNotCompleted && noDelayActive;
  });

  const hasActiveForm = availableExecution !== undefined;
  const hasNoForms = !executions || executions.length === 0;

  // Redirecionamento automático imediato para qualquer execução disponível
  React.useEffect(() => {
    console.log('🔍 PatientDashboard: Verificando redirecionamento automático');
    console.log('🔍 flowsLoading:', flowsLoading);
    console.log('🔍 availableExecution:', availableExecution);
    
    if (!flowsLoading && availableExecution) {
      console.log('✅ Execução disponível detectada, redirecionando imediatamente:', availableExecution);
      navigate(`/flow-execution/${availableExecution.id}`);
      return;
    } else {
      console.log('❌ Nenhuma execução disponível para redirecionamento');
    }
  }, [flowsLoading, availableExecution, navigate]);

  // Limite o progresso a 100%
  const progressPercentage = Math.min(availableExecution?.progresso || 0, 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:bg-none dark:bg-[#0E0E0E] p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
        {/* Header de Boas-vindas */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-[#5D8701] to-[#4a6e01] rounded-full mb-4 md:mb-6">
            <Workflow className="h-8 w-8 md:h-10 md:w-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 md:mb-4">
            Olá, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Bem-vindo ao seu painel pessoal. Aqui você pode acessar seus formulários e acompanhar seu progresso.
          </p>
        </div>

        {/* Status dos Formulários */}
        {hasNoForms ? (
          <Card className="bg-white dark:bg-[#0E0E0E] border border-gray-200 dark:border-[#1A1A1A] shadow-lg">
            <CardContent className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-[#5D8701] to-[#4a6e01] rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Nenhum formulário disponível
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Você ainda não possui formulários atribuídos. Em breve poderá receber novos formulários.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                Aguarde ou entre em contato com a clínica para mais informações.
              </p>
            </CardContent>
          </Card>
        ) : hasActiveForm ? (
          <Card className="bg-white dark:bg-[#0E0E0E] border border-gray-200 dark:border-[#1A1A1A] shadow-lg overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#5D8701] to-[#4a6e01]"></div>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl text-gray-900 dark:text-gray-100 mb-2">
                    📋 Formulário em Andamento
                  </CardTitle>
                  <h3 className="text-lg font-medium text-[#5D8701] mb-1">
                    {availableExecution?.flow_name}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Progresso</div>
                  <div className="text-2xl font-bold text-[#5D8701]">
                    {progressPercentage}%
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                    {availableExecution?.status === 'em-andamento' ? 'Em Andamento' : 'Pausado'}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {availableExecution?.completed_steps || 0} de {availableExecution?.total_steps || 0} etapas
                </span>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-[#1A1A1A] rounded-full h-2 mb-6">
                <div 
                  className="bg-gradient-to-r from-[#5D8701] to-[#4a6e01] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>

              <Button 
                onClick={() => navigate(`/flow-execution/${availableExecution?.id}`)}
                className="w-full bg-gradient-to-r from-[#5D8701] to-[#4a6e01] hover:from-[#4a6e01] hover:to-[#5D8701] text-white"
                size="lg"
              >
                Continuar Formulário
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white dark:bg-[#0E0E0E] border border-gray-200 dark:border-[#1A1A1A] shadow-lg">
            <CardContent className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-[#5D8701] to-[#4a6e01] rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Formulários Concluídos
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Você concluiu todos os formulários ativos. Novos formulários podem estar disponíveis em breve.
              </p>
              <Button 
                onClick={() => navigate('/my-flows')} 
                variant="outline"
                className="border-[#5D8701] text-[#5D8701] hover:bg-[#5D8701] hover:text-white"
              >
                Ver Histórico
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Link para Meus Formulários */}
        <Card className="bg-white dark:bg-[#0E0E0E] border border-gray-200 dark:border-[#1A1A1A] shadow-lg">
          <CardContent className="p-4">
            <Button 
              onClick={() => navigate('/my-flows')}
              variant="ghost" 
              className="w-full justify-between text-gray-700 dark:text-gray-300 hover:text-[#5D8701] hover:bg-[#5D8701]/5"
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Ver Todos os Meus Formulários
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientDashboard;