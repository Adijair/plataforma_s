
import React, { useRef, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Printer, Share2, Plus, Trash2, Save } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const statusLabels = {
  em_aberto: "Em Aberto",
  aguardando_cliente: "Aguardando Cliente",
  concluido: "Concluído",
  finalizado: "Finalizado"
};

export default function VisualizarOS() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const printRef = useRef();
  
  const urlParams = new URLSearchParams(window.location.search);
  const osId = urlParams.get('id');

  const [statusLocal, setStatusLocal] = useState("");
  const [pecasLocal, setPecasLocal] = useState([]);
  const [novaPeca, setNovaPeca] = useState({ nome: "", valor: "" });
  const [modoEdicao, setModoEdicao] = useState(false);
  
  // Estados para edição da OS
  const [editandoOS, setEditandoOS] = useState({
    marca: "",
    modelo: "",
    defeito: "",
    observacoes: "",
    valor_servico: "",
    checklist: {
      pedal: false,
      calcador: false,
      caixa_bobina: false,
      avaria: false
    }
  });

  const { data: ordem, isLoading } = useQuery({
    queryKey: ['ordem', osId],
    queryFn: async () => {
      const ordens = await base44.entities.OrdemServico.list();
      return ordens.find(o => o.id === osId);
    },
    enabled: !!osId
  });

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const configs = await base44.entities.Configuracao.list();
      return configs[0] || null;
    }
  });

  useEffect(() => {
    if (ordem) {
      setStatusLocal(ordem.status);
      setPecasLocal(ordem.pecas || []);
      setEditandoOS({
        marca: ordem.marca || "",
        modelo: ordem.modelo || "",
        defeito: ordem.defeito || "",
        observacoes: ordem.observacoes || "",
        valor_servico: ordem.valor_servico !== undefined && ordem.valor_servico !== null ? String(ordem.valor_servico) : "", // Ensure it's a string for input
        checklist: ordem.checklist || {
          pedal: false,
          calcador: false,
          caixa_bobina: false,
          avaria: false
        }
      });
    }
  }, [ordem]);

  const saveChangesMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OrdemServico.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordem', osId] });
      queryClient.invalidateQueries({ queryKey: ['ordens'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-cliente'] });
      toast.success("Alterações salvas com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao salvar alterações");
    }
  });

  const deleteOSMutation = useMutation({
    mutationFn: (id) => base44.entities.OrdemServico.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens'] });
      queryClient.invalidateQueries({ queryKey: ['ordens-cliente'] });
      toast.success("OS deletada com sucesso!");
      navigate(createPageUrl("Dashboard"));
    },
    onError: () => {
      toast.error("Erro ao deletar OS");
    }
  });

  const handleSaveChanges = () => {
    const dataToUpdate = {
      status: statusLocal,
      pecas: pecasLocal,
      marca: editandoOS.marca,
      modelo: editandoOS.modelo,
      defeito: editandoOS.defeito,
      observacoes: editandoOS.observacoes,
      valor_servico: parseFloat(editandoOS.valor_servico) || 0,
      checklist: editandoOS.checklist
    };

    // Se o status mudou, adicionar ao histórico
    if (statusLocal !== ordem.status) {
      const historicoAtual = ordem.historico_status || [];
      dataToUpdate.historico_status = [
        ...historicoAtual,
        {
          status: statusLocal,
          data: new Date().toISOString()
        }
      ];
    }

    saveChangesMutation.mutate({
      id: ordem.id,
      data: dataToUpdate
    });
  };

  const handleDeleteOS = () => {
    deleteOSMutation.mutate(ordem.id);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const valorTotal = calcularValorTotal();
    const text = `*OS #${ordem.numero_os}*\n\n` +
      `Cliente: ${ordem.cliente_nome}\n` +
      `CPF: ${ordem.cliente_cpf}\n` +
      `Aparelho: ${editandoOS.marca} ${editandoOS.modelo}\n` +
      `Defeito: ${editandoOS.defeito}\n` +
      `Valor Total: R$ ${valorTotal.toFixed(2)}\n` +
      `Status: ${statusLabels[statusLocal]}\n\n` +
      `${config?.nome_empresa || 'Costumaq OS'}`;
    
    const whatsappUrl = `https://wa.me/${ordem.cliente_telefone?.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleAddPeca = () => {
    if (!novaPeca.nome || novaPeca.valor === "") {
      toast.error("Preencha todos os campos");
      return;
    }

    setPecasLocal([
      ...pecasLocal,
      { nome: novaPeca.nome, valor: parseFloat(novaPeca.valor) }
    ]);
    setNovaPeca({ nome: "", valor: "" });
    toast.success("Peça adicionada! Clique em 'Salvar Alterações' para confirmar");
  };

  const handleRemovePeca = (index) => {
    setPecasLocal(pecasLocal.filter((_, i) => i !== index));
    toast.success("Peça removida! Clique em 'Salvar Alterações' para confirmar");
  };

  const calcularValorTotal = () => {
    const valorServico = parseFloat(editandoOS.valor_servico) || 0;
    const valorPecas = pecasLocal.reduce((sum, peca) => sum + (peca.valor || 0), 0);
    return valorServico + valorPecas;
  };

  if (isLoading) {
    return <div className="p-4 md:p-6 text-center">Carregando...</div>;
  }

  if (!ordem) {
    return <div className="p-4 md:p-6 text-center">Ordem não encontrada</div>;
  }

  return (
    <>
      <style>{`
        @media print {
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body * {
            visibility: hidden;
          }
          
          #print-content, #print-content * {
            visibility: visible;
          }
          
          #print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            background: white;
            padding: 0;
            margin: 0;
          }
          
          .no-print {
            display: none !important;
          }
          
          @page {
            size: 80mm auto;
            margin: 0mm;
            padding: 0mm;
          }
          
          html, body {
            width: 80mm;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>

      <div className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b-2 border-gray-200 no-print">
          <div className="flex items-center gap-3 md:gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="border-2 border-gray-300"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">Ordem de Serviço</h2>
              <p className="text-xs md:text-sm text-gray-600 mt-1">OS #{ordem.numero_os}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={() => setModoEdicao(!modoEdicao)} 
              className="border-2 border-orange-300 text-orange-600 hover:bg-orange-50 flex-1 sm:flex-none" 
              size="sm"
            >
              <Save className="w-4 h-4 mr-2" />
              {modoEdicao ? "Ocultar Edição" : "Editar OS"}
            </Button>
            <Button variant="outline" onClick={handleShare} className="border-2 border-gray-300 flex-1 sm:flex-none" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
            <Button onClick={handlePrint} className="bg-[#cf1d2d] hover:bg-[#e02638] flex-1 sm:flex-none" size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="flex-1 sm:flex-none">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Deletar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja deletar esta OS? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteOS} className="bg-red-600 hover:bg-red-700">
                    Deletar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Status */}
        <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded border-2 border-red-200 no-print">
          <Label className="mb-2 block font-bold text-sm md:text-base">Alterar Status</Label>
          <Select value={statusLocal} onValueChange={setStatusLocal}>
            <SelectTrigger className="border-2 border-red-300 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="em_aberto">Em Aberto</SelectItem>
              <SelectItem value="aguardando_cliente">Aguardando Cliente</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="finalizado">Finalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Editar Dados da OS - Condicional */}
        {modoEdicao && (
          <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded border-2 border-orange-200 no-print">
            <h3 className="font-bold text-gray-800 mb-4 text-sm md:text-base">Editar Dados da OS</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="edit-marca">Marca do Aparelho</Label>
                <Input
                  id="edit-marca"
                  value={editandoOS.marca}
                  onChange={(e) => setEditandoOS({ ...editandoOS, marca: e.target.value })}
                  className="border-2 border-orange-300"
                />
              </div>
              <div>
                <Label htmlFor="edit-modelo">Modelo</Label>
                <Input
                  id="edit-modelo"
                  value={editandoOS.modelo}
                  onChange={(e) => setEditandoOS({ ...editandoOS, modelo: e.target.value })}
                  className="border-2 border-orange-300"
                />
              </div>
            </div>

            <div className="mb-4">
              <Label htmlFor="edit-defeito">Defeito Relatado</Label>
              <Textarea
                id="edit-defeito"
                value={editandoOS.defeito}
                onChange={(e) => setEditandoOS({ ...editandoOS, defeito: e.target.value })}
                className="border-2 border-orange-300 min-h-24"
              />
            </div>

            <div className="mb-4">
              <Label htmlFor="edit-observacoes">Observações</Label>
              <Textarea
                id="edit-observacoes"
                value={editandoOS.observacoes}
                onChange={(e) => setEditandoOS({ ...editandoOS, observacoes: e.target.value })}
                className="border-2 border-orange-300 min-h-20"
              />
            </div>

            <div className="mb-4">
              <Label htmlFor="edit-valor_servico">Valor do Serviço (R$)</Label>
              <Input
                id="edit-valor_servico"
                type="number"
                step="0.01"
                value={editandoOS.valor_servico}
                onChange={(e) => setEditandoOS({ ...editandoOS, valor_servico: e.target.value })}
                className="border-2 border-orange-300"
              />
            </div>

            <div>
              <Label className="mb-2 block">Checklist de Acessórios</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['pedal', 'calcador', 'caixa_bobina', 'avaria'].map((item) => (
                  <div key={item} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`edit-${item}`}
                      checked={editandoOS.checklist[item]}
                      onChange={(e) =>
                        setEditandoOS({
                          ...editandoOS,
                          checklist: { ...editandoOS.checklist, [item]: e.target.checked }
                        })
                      }
                      className="w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor={`edit-${item}`} className="text-sm font-medium capitalize cursor-pointer">
                      {item.replace('_', ' ')}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Adicionar Peças */}
        {modoEdicao && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded border-2 border-blue-200 no-print">
            <Label className="mb-2 block font-bold text-sm md:text-base">Adicionar Peça</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder="Nome da peça"
                value={novaPeca.nome}
                onChange={(e) => setNovaPeca({ ...novaPeca, nome: e.target.value })}
                className="border-2 border-blue-300"
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Valor (R$)"
                value={novaPeca.valor}
                onChange={(e) => setNovaPeca({ ...novaPeca, valor: e.target.value })}
                className="border-2 border-blue-300"
              />
              <Button onClick={handleAddPeca} className="bg-[#cf1d2d] hover:bg-[#e02638]">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>
        )}

        {/* Lista de Peças */}
        {modoEdicao && pecasLocal.length > 0 && (
          <div className="mb-6 p-4 bg-white rounded border-2 border-gray-300 no-print">
            <h3 className="font-bold mb-3 text-sm md:text-base">Peças Adicionadas</h3>
            <div className="space-y-2">
              {pecasLocal.map((peca, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border-2 border-gray-200">
                  <div>
                    <p className="font-medium text-sm md:text-base">{peca.nome}</p>
                    <p className="text-xs md:text-sm text-gray-600">R$ {peca.valor.toFixed(2)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemovePeca(index)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Área de Impressão - 80mm com fonte maior e espaçamento reduzido */}
        <div id="print-content" style={{ width: '80mm', margin: '0 auto', padding: '3mm', backgroundColor: 'white' }} className="bg-white border-2 border-gray-300 rounded">
          {/* Cabeçalho */}
          <div style={{ textAlign: 'center', marginBottom: '5px', paddingBottom: '5px', borderBottom: '3px solid #000' }}>
            {config?.logo_url && (
              <img src={config.logo_url} alt="Logo" style={{ height: '45px', margin: '0 auto 5px', display: 'block', maxWidth: '70mm' }} />
            )}
            <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '2px', lineHeight: '1.1' }}>
              {config?.nome_empresa || "Costumaq OS"}
            </div>
            {config?.cnpj && <div style={{ fontSize: '10px', fontWeight: 'bold', margin: '1px 0' }}>CNPJ: {config.cnpj}</div>}
            {config?.telefone && <div style={{ fontSize: '10px', fontWeight: 'bold', margin: '1px 0' }}>Tel: {config.telefone}</div>}
            {config?.endereco && <div style={{ fontSize: '9px', fontWeight: 'bold', margin: '1px 0', lineHeight: '1.2' }}>{config.endereco}</div>}
          </div>

          <div style={{ textAlign: 'center', marginBottom: '5px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '0.5px' }}>ORDEM DE SERVIÇO</div>
            <div style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 'bold', marginTop: '1px' }}>Nº {ordem.numero_os}</div>
          </div>

          {/* Dados do Cliente */}
          <div style={{ marginBottom: '5px', paddingBottom: '3px', borderBottom: '2px solid #333' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '2px', textDecoration: 'underline' }}>DADOS DO CLIENTE</div>
            <div style={{ fontSize: '15px', fontWeight: 'bold', margin: '2px 0', lineHeight: '1.3' }}>Nome: {ordem.cliente_nome}</div>
            <div style={{ fontSize: '15px', fontWeight: 'bold', margin: '2px 0' }}>CPF: {ordem.cliente_cpf}</div>
            <div style={{ fontSize: '15px', fontWeight: 'bold', margin: '2px 0' }}>Tel: {ordem.cliente_telefone}</div>
          </div>

          {/* Dados do Aparelho */}
          <div style={{ marginBottom: '5px', paddingBottom: '3px', borderBottom: '2px solid #333' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '2px', textDecoration: 'underline' }}>DADOS DO APARELHO</div>
            <div style={{ fontSize: '15px', fontWeight: 'bold', margin: '2px 0' }}>Marca: {editandoOS.marca}</div>
            <div style={{ fontSize: '15px', fontWeight: 'bold', margin: '2px 0' }}>Modelo: {editandoOS.modelo}</div>
            <div style={{ fontSize: '15px', fontWeight: 'bold', margin: '2px 0' }}>
              Entrada: {format(new Date(ordem.data_entrada), "dd/MM/yyyy", { locale: ptBR })}
            </div>
          </div>

          {/* Defeito */}
          <div style={{ marginBottom: '5px', paddingBottom: '3px', borderBottom: '2px solid #333' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '2px', textDecoration: 'underline' }}>DEFEITO RELATADO</div>
            <div style={{ fontSize: '15px', fontWeight: 'bold', lineHeight: '1.4', wordWrap: 'break-word' }}>{editandoOS.defeito}</div>
          </div>

          {/* Checklist - Apenas itens marcados */}
          {(editandoOS.checklist.pedal || editandoOS.checklist.calcador || editandoOS.checklist.caixa_bobina || editandoOS.checklist.avaria) && (
            <div style={{ marginBottom: '5px', paddingBottom: '3px', borderBottom: '2px solid #333' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '2px', textDecoration: 'underline' }}>CHECKLIST</div>
              <div style={{ fontSize: '15px', fontWeight: 'bold' }}>
                {editandoOS.checklist.pedal && <div style={{ marginBottom: '2px' }}>✓ Pedal</div>}
                {editandoOS.checklist.calcador && <div style={{ marginBottom: '2px' }}>✓ Calcador</div>}
                {editandoOS.checklist.caixa_bobina && <div style={{ marginBottom: '2px' }}>✓ Caixa Bobina</div>}
                {editandoOS.checklist.avaria && <div style={{ marginBottom: '2px' }}>⚠ Avaria</div>}
              </div>
            </div>
          )}

          {/* Peças */}
          {pecasLocal.length > 0 && (
            <div style={{ marginBottom: '5px', paddingBottom: '3px', borderBottom: '2px solid #333' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '2px', textDecoration: 'underline' }}>PEÇAS UTILIZADAS</div>
              {pecasLocal.map((peca, index) => (
                <div key={index} style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '2px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ flex: '1', paddingRight: '5px' }}>{peca.nome}</span>
                  <span style={{ whiteSpace: 'nowrap' }}>R$ {peca.valor.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Observações */}
          {editandoOS.observacoes && (
            <div style={{ marginBottom: '5px', paddingBottom: '3px', borderBottom: '2px solid #333' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '2px', textDecoration: 'underline' }}>OBSERVAÇÕES</div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', lineHeight: '1.4', wordWrap: 'break-word' }}>{editandoOS.observacoes}</div>
            </div>
          )}

          {/* Valores */}
          <div style={{ marginBottom: '5px', paddingBottom: '3px', borderBottom: '2px solid #333' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '2px', textDecoration: 'underline' }}>VALORES</div>
            {parseFloat(editandoOS.valor_servico) > 0 && (
              <div style={{ fontSize: '15px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Serviço:</span>
                <span>R$ {parseFloat(editandoOS.valor_servico).toFixed(2)}</span>
              </div>
            )}
            {pecasLocal.length > 0 && (
              <div style={{ fontSize: '15px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Peças:</span>
                <span>R$ {pecasLocal.reduce((sum, p) => sum + p.valor, 0).toFixed(2)}</span>
              </div>
            )}
            <div style={{ fontSize: '17px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingTop: '4px', borderTop: '2px solid #000' }}>
              <span>TOTAL:</span>
              <span>R$ {(parseFloat(editandoOS.valor_servico) + pecasLocal.reduce((sum, p) => sum + p.valor, 0)).toFixed(2)}</span>
            </div>
          </div>

          {/* Rodapé */}
          <div style={{ textAlign: 'center', marginTop: '4px', paddingTop: '3px', borderTop: '3px solid #000' }}>
            {config?.mensagem_os && (
              <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', lineHeight: '0.91', wordWrap: 'break-word' }}>{config.mensagem_os}</div>
            )}
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '1px' }}>Status: {statusLabels[statusLocal]}</div>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '2px' }}>Obrigado pela preferência!</div>
          </div>
        </div>
        
        {/* Timeline de Status - MOVIDO PARA CÁ */}
        {ordem.historico_status && ordem.historico_status.length > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded border-2 border-purple-200 no-print">
            <h3 className="font-bold text-gray-800 mb-4 text-sm md:text-base flex items-center gap-2">
              📅 Histórico de Status
            </h3>
            <div className="space-y-3">
              {ordem.historico_status.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-3 h-3 bg-purple-500 rounded-full"></div>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 bg-white p-3 rounded border border-purple-200">
                    <span className="font-medium text-gray-800 text-sm md:text-base">
                      {statusLabels[item.status]}
                    </span>
                    <span className="text-xs md:text-sm text-gray-600">
                      {format(new Date(item.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {statusLocal === "finalizado" && ordem.historico_status.find(h => h.status === "finalizado") && (
              <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded">
                <p className="text-xs md:text-sm text-green-800 font-medium">
                  ✅ Garantia iniciada em: {format(new Date(ordem.historico_status.find(h => h.status === "finalizado").data), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Fotos */}
        {ordem.fotos && ordem.fotos.length > 0 && (
          <div className="mt-6 no-print">
            <h3 className="font-bold mb-3 text-sm md:text-base">Fotos do Aparelho</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ordem.fotos.map((foto, index) => (
                <img
                  key={index}
                  src={foto}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-32 md:h-48 object-cover rounded border-2 border-gray-300"
                />
              ))}
            </div>
          </div>
        )}

        {/* Botão Salvar Alterações */}
        <div className="flex justify-end mt-8 pt-6 border-t-2 border-gray-200 no-print">
          <Button
            onClick={handleSaveChanges}
            disabled={saveChangesMutation.isPending}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md px-6 md:px-8 py-4 md:py-6 text-base md:text-lg w-full sm:w-auto"
          >
            <Save className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            {saveChangesMutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>
    </>
  );
}
