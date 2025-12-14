import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getResults, updateVote, deleteRound } from '../api';
import { useTranslation } from '../i18n';

function HostView() {
    const { roundId } = useParams();
    const [searchParams] = useSearchParams();
    const key = searchParams.get('key');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editingVote, setEditingVote] = useState(null); // { voteId, value }
    const { t } = useTranslation();

    useEffect(() => {
        loadResults();
        const interval = setInterval(loadResults, 5000);
        return () => clearInterval(interval);
    }, [roundId, key]);

    const loadResults = async () => {
        try {
            const data = await getResults(roundId, key);
            // Sort by total resistance (ascending)
            data.options.sort((a, b) => a.total_resistance - b.total_resistance);
            setResults(data);
        } catch (error) {
            console.error("Failed to load results");
        } finally {
            setLoading(false);
        }
    };

    const handleEditVote = async (voteId, newValue) => {
        try {
            await updateVote(roundId, voteId, newValue, key);
            setEditingVote(null);
            loadResults();
        } catch (error) {
            alert("Failed to update vote");
        }
    };

    if (loading) return <div className="container">{t('loading')}</div>;
    if (!results) return <div className="container">Unauthorized or Not Found. Check your link.</div>;

    const winner = results.options[0];
    const isAutoDecided = results.decision_made;

    // Process detailed votes for matrix
    // Get unique user names (or IDs)
    const userMap = {};
    results.votes.forEach(v => {
        const identifier = v.user_name || v.user_identifier || 'Unknown';
        if (!userMap[identifier]) userMap[identifier] = {};
        userMap[identifier][v.option_id] = v;
    });
    const users = Object.keys(userMap);

    const handleDeleteRound = async () => {
        if (confirm(t('deleteConfirm'))) {
            try {
                await deleteRound(roundId, key);
                alert(t('roundDeleted'));
                setResults(null);
            } catch (e) {
                alert("Error deleting round");
            }
        }
    };

    return (
        <div className="container">
            <h1>{t('evaluation')}</h1>

            {isAutoDecided && (
                <div className="card winner-card">
                    <h2 style={{ color: '#22c55e' }}>{t('decisionReached')}</h2>
                    <p style={{ fontSize: '1.2rem' }}>
                        {t('decisionText', { option: winner.text })}
                    </p>
                </div>
            )}

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>{t('links')}</h2>
                </div>
                <div className="form-group">
                    <label>{t('participantLink')}</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="text" readOnly value={`${window.location.origin}/rounds/${roundId}`} />
                        <button className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/rounds/${roundId}`)}>{t('copy')}</button>
                    </div>
                </div>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Overview</h2>
                    <button className="btn btn-secondary" onClick={loadResults}>{t('refresh')}</button>
                </div>

                <table className="results-table">
                    <thead>
                        <tr>
                            <th>{t('option')}</th>
                            <th>{t('totalResistance')}</th>
                            <th>{t('avg')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.options.map((opt, idx) => (
                            <tr key={opt.id} style={idx === 0 ? { background: 'rgba(255,255,255,0.05)' } : {}}>
                                <td>
                                    <strong>{opt.text}</strong>
                                    {idx === 0 && <span style={{ marginLeft: '0.5rem' }}>⭐</span>}
                                </td>
                                <td>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{opt.total_resistance}</span>
                                </td>
                                <td>
                                    {opt.average_resistance.toFixed(1)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="card">
                <h2>{t('matrixTitle')}</h2>
                <p className="helper-text">{t('matrixHelper')}</p>
                <div style={{ overflowX: 'auto' }}>
                    <table className="results-table">
                        <thead>
                            <tr>
                                <th>{t('participants')}</th>
                                {results.options.map(opt => (
                                    <th key={opt.id}>{opt.text}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user}>
                                    <td><strong>{user}</strong></td>
                                    {results.options.map(opt => {
                                        const vote = userMap[user][opt.id];
                                        return (
                                            <td key={opt.id}>
                                                {vote ? (
                                                    editingVote?.voteId === vote.id ? (
                                                        <input
                                                            type="number"
                                                            min="0" max="10"
                                                            defaultValue={vote.value}
                                                            onBlur={(e) => handleEditVote(vote.id, parseInt(e.target.value))}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleEditVote(vote.id, parseInt(e.currentTarget.value));
                                                                if (e.key === 'Escape') setEditingVote(null);
                                                            }}
                                                            autoFocus
                                                            style={{ width: '60px', padding: '0.25rem' }}
                                                        />
                                                    ) : (
                                                        <span
                                                            className={`score-badge ${vote.value > 7 ? 'score-high' : vote.value > 3 ? 'score-med' : 'score-low'}`}
                                                            style={{ cursor: 'pointer' }}
                                                            onClick={() => setEditingVote({ voteId: vote.id, value: vote.value })}
                                                            title="Click to edit"
                                                        >
                                                            {vote.value}
                                                        </span>
                                                    )
                                                ) : '-'}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card">
                <h3>{t('adminActions')}</h3>
                <p className="helper-text">
                    {t('adminHelper')}
                </p>
                <button
                    className="btn"
                    style={{ backgroundColor: '#ef4444', marginTop: '1rem' }}
                    onClick={handleDeleteRound}
                >
                    {t('deleteRound')} 🗑️
                </button>
            </div>
        </div>
    );
}

export default HostView;
