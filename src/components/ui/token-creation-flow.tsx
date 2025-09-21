import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, CheckCircle, Loader2, Circle, AlertCircle, Rocket } from 'lucide-react';
import { toast } from 'sonner';

export interface TokenCreationFlowProps {
  isOpen: boolean;
  onClose: () => void;
  tokenData: {
    name: string;
    symbol: string;
    description: string;
    imageUrl: string;
    website: string;
    twitter: string;
    telegram: string;
    initialPurchase: number;
  };
  okbAllowance: number;
  onApproveOKB: (amount: number) => Promise<void>;
  onCreateToken: (data: TokenCreationFlowProps['tokenData']) => Promise<void>;
  onCheckTokenAddress: (hash: string) => Promise<string | null>;
  isApproving: boolean;
  isCreating: boolean;
  approvalHash?: string;
  txHash?: string;
}

type Step = 'APPROVAL' | 'CREATE' | 'SYNC' | 'DONE' | 'ERROR';

type StepState = {
  title: string;
  message?: string;
  status: 'pending' | 'loading' | 'done' | 'error' | 'timeout';
  hash?: string;
  hint?: string;
};

export function TokenCreationFlow(props: TokenCreationFlowProps) {
  const { isOpen, onClose, tokenData, okbAllowance, onApproveOKB, onCreateToken, onCheckTokenAddress, isApproving, isCreating, approvalHash, txHash } = props;

  const [step, setStep] = useState<Step>('APPROVAL');
  const [states, setStates] = useState<Record<Step, StepState>>({
    APPROVAL: { title: 'Authorize OKB', status: 'pending' },
    CREATE: { title: 'Create Token', status: 'pending' },
    SYNC: { title: 'Sync & Redirect', status: 'pending' },
    DONE: { title: 'Completed', status: 'pending' },
    ERROR: { title: 'Error', status: 'pending' },
  });

  const startedApproval = useRef(false);
  const startedCreate = useRef(false);
  const startedSync = useRef(false);
  const approvalTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const creationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const needsApproval = useMemo(() => tokenData.initialPurchase > 0 && okbAllowance < tokenData.initialPurchase, [tokenData.initialPurchase, okbAllowance]);

  const clearTimers = () => {
    if (approvalTimeoutRef.current) clearTimeout(approvalTimeoutRef.current);
    if (creationTimeoutRef.current) clearTimeout(creationTimeoutRef.current);
    approvalTimeoutRef.current = null;
    creationTimeoutRef.current = null;
  };

  useEffect(() => { return () => clearTimers(); }, []);

  const handleOpenWallet = async () => {
    try {
      // 触发账户请求，可促使钱包弹窗
      // 这不会改变授权，仅用于唤起钱包界面
      // 部分浏览器需要用户手势，这里按钮点击即可
      // @ts-ignore
      if (window.ethereum) {
        // @ts-ignore
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      } else {
        toast.info('Please open your wallet extension');
      }
    } catch (e) {
      // 静默处理
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    // Step 1: Approval
    if (step === 'APPROVAL') {
      if (!needsApproval) {
        setStates(s => ({ ...s, APPROVAL: { ...s.APPROVAL, status: 'done', message: `Approved (${okbAllowance} OKB)` }}));
        setStep('CREATE');
        return;
      }
      if (!startedApproval.current) {
        startedApproval.current = true;
        setStates(s => ({ ...s, APPROVAL: { ...s.APPROVAL, status: 'loading', message: `Requesting authorization of ${tokenData.initialPurchase} OKB...`, hint: 'Please confirm in MetaMask' }}));
        // 启动超时：若用户未打开钱包，给出提示和按钮
        if (approvalTimeoutRef.current) clearTimeout(approvalTimeoutRef.current);
        approvalTimeoutRef.current = setTimeout(() => {
          setStates(s => ({
            ...s,
            APPROVAL: { ...s.APPROVAL, status: 'timeout', message: 'Waiting for wallet confirmation...', hint: 'Wallet not detected. Click "Open Wallet" or Retry.' }
          }));
        }, 20000);
        onApproveOKB(tokenData.initialPurchase).catch(err => {
          setStates(s => ({ ...s, ERROR: { ...s.ERROR, status: 'error', message: 'Authorization failed' }}));
          setStep('ERROR');
          toast.error('Authorization failed');
        });
      }
    }
  }, [isOpen, step, needsApproval, onApproveOKB, okbAllowance, tokenData.initialPurchase]);

  // approval progress
  useEffect(() => {
    if (!isOpen) return;
    if (step !== 'APPROVAL') return;
    if (isApproving) {
      setStates(s => ({ ...s, APPROVAL: { ...s.APPROVAL, status: 'loading', message: 'Waiting for wallet confirmation...', hint: 'Please confirm in MetaMask' }}));
    }
    if (approvalHash && !isApproving) {
      clearTimers();
      setStates(s => ({ ...s, APPROVAL: { ...s.APPROVAL, status: 'done', message: 'Authorization confirmed', hash: approvalHash, hint: undefined }}));
      setStep('CREATE');
    }
  }, [isOpen, step, isApproving, approvalHash]);

  // Step 2: Create
  useEffect(() => {
    if (!isOpen) return;
    if (step !== 'CREATE') return;
    if (!startedCreate.current) {
      startedCreate.current = true;
      setStates(s => ({ ...s, CREATE: { ...s.CREATE, status: 'loading', message: 'Sending creation transaction...', hint: 'Please confirm in MetaMask' }}));
      // 创建超时
      if (creationTimeoutRef.current) clearTimeout(creationTimeoutRef.current);
      creationTimeoutRef.current = setTimeout(() => {
        setStates(s => ({
          ...s,
          CREATE: { ...s.CREATE, status: 'timeout', message: 'Waiting for wallet confirmation...', hint: 'Wallet not detected. Click "Open Wallet" or Retry.' }
        }));
      }, 20000);
      onCreateToken(tokenData).catch(err => {
        setStates(s => ({ ...s, ERROR: { ...s.ERROR, status: 'error', message: 'Creation failed' }}));
        setStep('ERROR');
        toast.error('Creation failed');
      });
    }
  }, [isOpen, step, onCreateToken, tokenData]);

  // creation progress
  useEffect(() => {
    if (!isOpen) return;
    if (step !== 'CREATE') return;
    if (isCreating) {
      setStates(s => ({ ...s, CREATE: { ...s.CREATE, status: 'loading', message: 'Waiting for wallet confirmation...', hint: 'Please confirm in MetaMask' }}));
    }
    if (txHash && !isCreating) {
      clearTimers();
      setStates(s => ({ ...s, CREATE: { ...s.CREATE, status: 'done', message: 'Creation confirmed', hash: txHash, hint: undefined }}));
      setStep('SYNC');
    }
  }, [isOpen, step, isCreating, txHash]);

  // Step 3: Sync
  useEffect(() => {
    if (!isOpen) return;
    if (step !== 'SYNC') return;
    if (startedSync.current) return;
    
    // 等待实际交易哈希可用
    if (!txHash) {

      return;
    }
    
    startedSync.current = true;
    setStates(s => ({ ...s, SYNC: { ...s.SYNC, status: 'loading', message: 'Syncing with backend...' }}));

    const run = async () => {

      let attempts = 0;
      const maxAttempts = 60; // 增加到60次重试
      
      while (attempts < maxAttempts) {
        attempts += 1;
        
        // 更新状态信息，显示更详细的进度
        let statusMessage = `Syncing... (${attempts}/${maxAttempts})`;
        if (attempts <= 10) {
          statusMessage += ' - Initial sync';
        } else if (attempts <= 30) {
          statusMessage += ' - Waiting for blockchain confirmation';
        } else {
          statusMessage += ' - Backend processing';
        }
        
        setStates(s => ({ ...s, SYNC: { ...s.SYNC, status: 'loading', message: statusMessage }}));
        
        try {
          const addr = await onCheckTokenAddress(txHash);
          if (addr) {

            setStates(s => ({ ...s, SYNC: { ...s.SYNC, status: 'done', message: `Token found: ${addr}` }}));
            setStep('DONE');
            
            // 使用 Next.js router 进行跳转，而不是 window.location.href
            setTimeout(() => {
              // 使用 window.location.href 确保完全刷新页面，避免缓存问题
              window.location.href = `/token/${addr}`;
            }, 1000);
            return;
          }
        } catch (error) {

          // 如果是明确的404错误（代币未找到），继续重试
          // 如果是其他错误，也继续重试，但记录错误信息
          if (attempts % 10 === 0) {
            setStates(s => ({ ...s, SYNC: { ...s.SYNC, message: `${statusMessage} - Please wait...` }}));
          }
        }
        
        // 调整等待时间：前10次快速重试，之后较长等待以配合30秒的事件监听器周期
        let waitTime;
        if (attempts <= 10) {
          waitTime = 2000; // 前10次每2秒重试一次
        } else if (attempts <= 30) {
          waitTime = 5000; // 接下来20次每5秒重试一次
        } else {
          waitTime = 10000; // 最后30次每10秒重试一次
        }
        
        await new Promise(r => setTimeout(r, waitTime));
      }
      
      // 所有重试都失败了

      setStates(s => ({ 
        ...s, 
        SYNC: { 
          ...s.SYNC, 
          status: 'error', 
          message: 'Sync timeout. The token may still be processing. Please check your profile or try refreshing the page later.',
          hint: 'You can also manually navigate to your profile to find the newly created token.'
        }
      }));
      setStep('ERROR');
    };
    run();
  }, [isOpen, step, onCheckTokenAddress, txHash]);

  const Icon = (st: StepState) => {
    if (st.status === 'done') return <CheckCircle className="h-5 w-5 text-green-400" />;
    if (st.status === 'loading') return <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />;
    if (st.status === 'error') return <AlertCircle className="h-5 w-5 text-red-400" />;
    if (st.status === 'timeout') return <AlertCircle className="h-5 w-5 text-yellow-400" />;
    return <Circle className="h-5 w-5 text-gray-400" />;
  };

  const renderStepBlock = (key: Step) => {
    const st = states[key];
    const showActions = st.status === 'timeout';
    return (
      <div className="flex items-start gap-3 bg-[#0E0E0E] rounded-lg p-4">
        <Icon {...st} />
        <div className="flex-1">
          <div className="font-medium">{st.title}</div>
          <div className="text-sm text-gray-400 mt-1">{st.message}</div>
          {st.hash && (
            <a
              href={`https://sepolia.etherscan.io/tx/${st.hash}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#70E000] hover:text-[#5BC000] inline-flex items-center gap-1 mt-1"
            >
              View Transaction <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {st.hint && (
            <div className="text-xs text-gray-500 mt-1">{st.hint}</div>
          )}
          {showActions && (
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="secondary" onClick={handleOpenWallet} className="border-[#232323]">
                Open Wallet
              </Button>
              {key === 'APPROVAL' && (
                <Button size="sm" className="bg-[#70E000] text-black hover:bg-[#5BC000]" onClick={() => {
                  startedApproval.current = false;
                  setStates(s => ({ ...s, APPROVAL: { ...s.APPROVAL, status: 'loading', message: 'Retrying authorization...', hint: 'Please confirm in MetaMask' }}));
                  if (approvalTimeoutRef.current) clearTimeout(approvalTimeoutRef.current);
                  approvalTimeoutRef.current = setTimeout(() => {
                    setStates(s => ({ ...s, APPROVAL: { ...s.APPROVAL, status: 'timeout', message: 'Waiting for wallet confirmation...', hint: 'Wallet not detected. Click "Open Wallet" or Retry.' } }));
                  }, 20000);
                  onApproveOKB(tokenData.initialPurchase).catch(() => {
                    setStates(s => ({ ...s, ERROR: { ...s.ERROR, status: 'error', message: 'Authorization failed' } }));
                    setStep('ERROR');
                  });
                }}>
                  Retry
                </Button>
              )}
              {key === 'CREATE' && (
                <Button size="sm" className="bg-[#70E000] text-black hover:bg-[#5BC000]" onClick={() => {
                  startedCreate.current = false;
                  setStates(s => ({ ...s, CREATE: { ...s.CREATE, status: 'loading', message: 'Retrying creation...', hint: 'Please confirm in MetaMask' } }));
                  if (creationTimeoutRef.current) clearTimeout(creationTimeoutRef.current);
                  creationTimeoutRef.current = setTimeout(() => {
                    setStates(s => ({ ...s, CREATE: { ...s.CREATE, status: 'timeout', message: 'Waiting for wallet confirmation...', hint: 'Wallet not detected. Click "Open Wallet" or Retry.' } }));
                  }, 20000);
                  onCreateToken(tokenData).catch(() => {
                    setStates(s => ({ ...s, ERROR: { ...s.ERROR, status: 'error', message: 'Creation failed' } }));
                    setStep('ERROR');
                  });
                }}>
                  Retry
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="bg-[#151515] border-[#232323] text-white max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center">
            <Rocket className="mr-2 h-6 w-6 text-[#70E000]" />
            Creating Token
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-[#0E0E0E] rounded-lg p-4">
            <div className="text-base font-semibold">{tokenData.name}</div>
            <div className="text-sm text-gray-400">{tokenData.symbol}</div>
            {tokenData.initialPurchase > 0 && (
              <div className="text-sm text-gray-400 mt-1">Initial Purchase: {tokenData.initialPurchase} OKB</div>
            )}
          </div>

          {(['APPROVAL','CREATE','SYNC'] as Step[]).map((k) => (
            <div key={k}>{renderStepBlock(k)}</div>
          ))}

          <div className="flex gap-3">
            <Button
              onClick={() => { onClose(); }}
              variant="outline"
              className="flex-1 border-[#232323] text-gray-300 hover:bg-[#232323]"
              disabled={step === 'APPROVAL' && (isApproving || states.APPROVAL.status === 'loading') || step === 'CREATE' && (isCreating || states.CREATE.status === 'loading')}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
