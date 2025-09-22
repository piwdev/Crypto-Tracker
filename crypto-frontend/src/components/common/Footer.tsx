import React from 'react';
import { useTranslation } from 'react-i18next';
import './Footer.css';

const Footer: React.FC = () => {
    
    const { t } = useTranslation();

    return (
        <footer className="footer">
            <div className="footer-content">
                <p className="footer-text">
                    {t('footer.dataSource')}
                </p>
            </div>
        </footer>
    );
};

export default Footer;