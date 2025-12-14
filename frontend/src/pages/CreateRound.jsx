import React, { useState } from 'react';
import { createRound } from '../api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';

function CreateRound() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [options, setOptions] = useState([{ text: '' }, { text: '' }]);
    const [links, setLinks] = useState(null);
    const { t } = useTranslation();

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index].text = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        setOptions([...options, { text: '' }]);
    };

    const removeOption = (index) => {
        if (options.length > 2) {
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validOptions = options.filter(o => o.text.trim() !== '');
        if (validOptions.length < 2) {
            alert("Need at least 2 options!");
            return;
        }

        try {
            const data = await createRound(title, description, validOptions);
            setLinks(data);
        } catch (error) {
            console.error("Failed to create round", error);
            alert("Error creating round");
        }
    };

    if (links) {
        return (
            <div className="container">
                <div className="card">
                    <h1>{t('shareTitle')} ✨</h1>
                    <div className="form-group">
                        <label>{t('participantLink')}</label>
                        <input type="text" readOnly value={`${window.location.origin}${links.participant_link}`} />
                        <button className="btn" style={{ marginTop: '0.5rem' }} onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}${links.participant_link}`);
                            // alert(t('copied'));
                        }}>{t('copy')}</button>
                    </div>

                    <div className="form-group" style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                        <label style={{ color: '#f472b6' }}>{t('hostLink')}</label>
                        <input type="text" readOnly value={`${window.location.origin}${links.host_link}`} />
                        <button className="btn btn-secondary" style={{ marginTop: '0.5rem' }} onClick={() => window.open(links.host_link, '_blank')}>Open Host View</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <h1>{t('createRound')}</h1>
            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>{t('topic')}</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t('topicPlaceholder')}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('description')}</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('descPlaceholder')}
                            rows={3}
                        />
                    </div>

                    <div className="form-group">
                        <label>{t('options')}</label>
                        <div className="option-list">
                            {options.map((opt, idx) => (
                                <div key={idx} className="option-item">
                                    <input
                                        type="text"
                                        value={opt.text}
                                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                                        placeholder={`${t('option')} ${idx + 1}`}
                                        required
                                    />
                                    {options.length > 2 && (
                                        <button type="button" className="btn btn-secondary btn-icon" onClick={() => removeOption(idx)}>
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button type="button" className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={addOption}>+ {t('addOption')}</button>
                    </div>

                    <button type="submit" className="btn" style={{ width: '100%', marginTop: '1rem' }}>{t('createBtn')} 🚀</button>
                </form>
            </div>
        </div>
    );
}

export default CreateRound;
