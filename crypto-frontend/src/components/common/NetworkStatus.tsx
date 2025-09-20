import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import './NetworkStatus.css';

const NetworkStatus: React.FC = () => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // ネットワーク状態の監視
    const unsubscribe = api.onNetworkChange((online) => {
      const wasOffline = !isOnline;
      setIsOnline(online);
      
      if (online && wasOffline) {
        // オンラインに復帰した場合
        setIsReconnecting(true);
        setShowStatus(true);
        
        // 接続テスト
        api.healthCheck().then((healthy) => {
          setIsReconnecting(false);
          if (healthy) {
            // 3秒後にステータスを非表示
            setTimeout(() => setShowStatus(false), 3000);
          }
        });
      } else if (!online) {
        // オフラインになった場合
        setShowStatus(true);
        setIsReconnecting(false);
      }
    });

    return unsubscribe;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 初期状態でオフラインの場合は表示
  useEffect(() => {
    if (!isOnline) {
      setShowStatus(true);
    }
  }, []);

  if (!showStatus) {
    return null;
  }

  const getStatusClass = () => {
    if (isReconnecting) return 'network-status--reconnecting';
    if (isOnline) return 'network-status--online';
    return 'network-status--offline';
  };

  const getStatusMessage = () => {
    if (isReconnecting) return t('network.reconnecting');
    if (isOnline) return t('network.backOnline');
    return t('network.offline');
  };

  const getStatusIcon = () => {
    if (isReconnecting) return '🔄';
    if (isOnline) return '✅';
    return '📡';
  };

  return (
    <div className={`network-status ${getStatusClass()}`}>
      <div className="network-status__content">
        <span className="network-status__icon" aria-hidden="true">
          {getStatusIcon()}
        </span>
        <span className="network-status__message">
          {getStatusMessage()}
        </span>
        {!isOnline && (
          <button
            className="network-status__retry"
            onClick={() => window.location.reload()}
          >
            {t('common.retry')}
          </button>
        )}
      </div>
    </div>
  );
};

export default NetworkStatus;