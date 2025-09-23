import React from 'react';
import { useTranslation } from 'react-i18next';
import './Footer.css';

const Footer: React.FC = () => {

    const { t } = useTranslation();

    return (
        <footer className="footer">
            <div className="footer-content">
                {
                    t('footer.aboutSite').split('\r\n').map((line: string, index: number) => (
                        <p key={index} className='footer-text'>
                            {line}
                            {index===0 ? <a href={t('footer.dataSourceURL')} target='_blank'>{t('footer.dataSourceName')}</a> : null }
                            </p>
                    ))
                }
            </div>
        </footer>
    );
};

export default Footer;