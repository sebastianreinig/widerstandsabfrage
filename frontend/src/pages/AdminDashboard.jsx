import React, { useState, useEffect } from 'react';
import { getAllRounds, deleteRoundAdmin } from '../api';
import { useTranslation } from '../i18n';

function AdminDashboard() {
    const [key, setKey] = useState(localStorage.getItem('admin_key') || '');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [rounds, setRounds] = useState([]);
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        if (key && isAuthenticated) {
            loadRounds();
        }
    }, [isAuthenticated]);

    const handleLogin = (e) => {
        e.preventDefault();
        // Optimistic login: we'll see if the API accepts the key
        localStorage.setItem('admin_key', key);
        setIsAuthenticated(true);
    };

    const loadRounds = async () => {
        setLoading(true);
        try {
            const data = await getAllRounds(key);
            setRounds(data);
        } catch (error) {
            console.error("Failed to load rounds", error);
            setIsAuthenticated(false); // Likely invalid key
            alert("Invalid Admin Key");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (roundId) => {
        if (confirm("Are you sure you want to DELETE this round? This is a super admin action.")) {
            try {
                await deleteRoundAdmin(roundId, key);
                setRounds(prev => prev.filter(r => r.id !== roundId));
            } catch (error) {
                alert("Failed to delete round");
            }
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="container">
                <div className="card">
                    <h1>Admin Login 🔐</h1>
                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label>Admin Key</label>
                            <input
                                type="password"
                                value={key}
                                onChange={e => setKey(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn" style={{ width: '100%' }}>Enter</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Admin Dashboard 🛡️</h1>
                <button className="btn btn-secondary" onClick={() => {
                    localStorage.removeItem('admin_key');
                    setIsAuthenticated(false);
                    setKey('');
                }}>Logout</button>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2>All Rounds ({rounds.length})</h2>
                    <button className="btn btn-secondary" onClick={loadRounds}>Refresh</button>
                </div>

                {loading ? <p>Loading...</p> : (
                    <table className="results-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>ID</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rounds.map(round => (
                                <tr key={round.id}>
                                    <td>{round.title}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{round.id}</td>
                                    <td>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ backgroundColor: '#ef4444', color: 'white' }}
                                            onClick={() => handleDelete(round.id)}
                                        >
                                            Delete
                                        </button>
                                        <button
                                            className="btn btn-secondary ml-2"
                                            style={{ marginLeft: '0.5rem' }}
                                            onClick={() => window.open(`/rounds/${round.id}`, '_blank')}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;
