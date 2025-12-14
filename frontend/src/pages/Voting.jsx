import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getRound, submitVote } from '../api';
import { useTranslation } from '../i18n';

function Voting() {
    const { roundId } = useParams();
    const [round, setRound] = useState(null);
    const [votes, setVotes] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState(localStorage.getItem('user_name') || '');
    const [showNameInput, setShowNameInput] = useState(!localStorage.getItem('user_name'));
    const { t } = useTranslation();

    useEffect(() => {
        loadRound();
    }, [roundId]);

    const loadRound = async () => {
        try {
            const data = await getRound(roundId);
            setRound(data);
            const initialVotes = {};
            data.options.forEach(o => initialVotes[o.id] = 0);
            setVotes(initialVotes);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleVoteChange = (optionId, value) => {
        setVotes(prev => ({ ...prev, [optionId]: parseInt(value) }));
    };

    const handleNameSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            localStorage.setItem('user_name', name);
            setShowNameInput(false);
        }
    };

    const handleSubmit = async () => {
        const payload = Object.entries(votes).map(([opId, val]) => ({
            option_id: parseInt(opId),
            value: val,
            user_identifier: localStorage.getItem('user_id') || `user_${Math.random().toString(36).substr(2, 9)}`,
            user_name: name
        }));

        if (!localStorage.getItem('user_id')) {
            localStorage.setItem('user_id', payload[0].user_identifier);
        }

        try {
            await submitVote(roundId, payload);
            setSubmitted(true);
        } catch (error) {
            alert("Error submitting vote");
        }
    };

    if (loading) return <div className="container">{t('loading')}</div>;
    if (!round) return <div className="container">{t('roundNotFound')}</div>;

    if (showNameInput) {
        return (
            <div className="container">
                <div className="card">
                    <h1>Welcome! 👋</h1>
                    <p>Please enter your name to join the round.</p>
                    <form onSubmit={handleNameSubmit}>
                        <div className="form-group">
                            <label>Your Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="btn" style={{ width: '100%' }}>Continue</button>
                    </form>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="container" style={{ textAlign: 'center' }}>
                <div className="card">
                    <h1 style={{ fontSize: '4rem' }}>🙌</h1>
                    <h2>Vote Submitted!</h2>
                    <p>Thank you for your participation, {name}.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1>{round.title}</h1>
                    <button className="btn btn-secondary" onClick={() => setShowNameInput(true)} title="Change Name">
                        👤 {name}
                    </button>
                </div>
                <p>{round.description}</p>
            </div>

            <div className="card">
                <h2>Rate your resistance (0 - 10)</h2>
                <p className="helper-text">0 = No Objection (Perfect), 10 = Veto (Cannot accept)</p>

                <div style={{ marginTop: '2rem' }}>
                    {round.options.map(option => (
                        <div key={option.id} style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <label style={{ fontSize: '1.2rem', color: 'var(--text)' }}>{option.text}</label>
                                <span className={`score-badge ${votes[option.id] > 7 ? 'score-high' : votes[option.id] > 3 ? 'score-med' : 'score-low'}`}>
                                    {votes[option.id]}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="10"
                                value={votes[option.id]}
                                onChange={(e) => handleVoteChange(option.id, e.target.value)}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                <span>No Objection</span>
                                <span>VETO</span>
                            </div>
                        </div>
                    ))}
                </div>

                <button className="btn" style={{ width: '100%', marginTop: '2rem' }} onClick={handleSubmit}>
                    Submit Vote
                </button>
            </div>
        </div>
    );
}

export default Voting;
