import React, { createContext, useState, useContext } from 'react';

const translations = {
    en: {
        createRound: "Create New Round",
        topic: "Topic",
        topicPlaceholder: "e.g., Dinner Plans",
        description: "Description (optional)",
        descPlaceholder: "Add some context...",
        options: "Options",
        addOption: "Add Option",
        createBtn: "Create Round",
        shareTitle: "Share this Round",
        participantLink: "Participant Link",
        hostLink: "Host Link",
        copy: "Copy",
        copied: "Copied!",
        welcome: "Welcome! 👋",
        enterName: "Please enter your name to join the round.",
        yourName: "Your Name",
        continue: "Continue",
        rateResistance: "Rate your resistance (0 - 10)",
        scaleHelper: "0 = No Objection (Perfect), 10 = Veto (Cannot accept)",
        noObjection: "No Objection",
        veto: "VETO",
        submitVote: "Submit Vote",
        voteSubmitted: "Vote Submitted!",
        thankYou: "Thank you for your participation",
        roundNotFound: "Round not found",
        loading: "Loading...",
        evaluation: "Evaluation 📊",
        decisionReached: "Decision Reached! 🏆",
        decisionText: "Option {option} has the least resistance and meets the acceptance criteria.",
        participants: "Participants",
        refresh: "Refresh",
        option: "Option",
        totalResistance: "Total Resistance",
        avg: "Avg",
        adminActions: "Admin Actions",
        adminHelper: "As a host, you can discuss with the group. If objections are resolved, you can manually edit the resistance values in the matrix above by clicking on them.",
        deleteRound: "Delete Round",
        deleteConfirm: "Are you sure you want to DELETE this round and all data? This cannot be undone.",
        roundDeleted: "Round deleted.",
        links: "Links",
        matrixTitle: "Detailed Vote Matrix",
        matrixHelper: "Click on a score to edit it.",
    },
    de: {
        createRound: "Neue Umfrage erstellen",
        topic: "Thema",
        topicPlaceholder: "z.B. Abendessen",
        description: "Beschreibung (optional)",
        descPlaceholder: "Kontext hinzufügen...",
        options: "Optionen",
        addOption: "Option hinzufügen",
        createBtn: "Umfrage erstellen",
        shareTitle: "Umfrage teilen",
        participantLink: "Teilnehmer-Link",
        hostLink: "Host-Link",
        copy: "Kopieren",
        copied: "Kopiert!",
        welcome: "Willkommen! 👋",
        enterName: "Bitte Namen eingeben, um teilzunehmen.",
        yourName: "Dein Name",
        continue: "Weiter",
        rateResistance: "Bewerte deinen Widerstand (0 - 10)",
        scaleHelper: "0 = Kein Einwand (Perfekt), 10 = Veto (Geht gar nicht)",
        noObjection: "Kein Einwand",
        veto: "VETO",
        submitVote: "Stimme abgeben",
        voteSubmitted: "Abgestimmt!",
        thankYou: "Danke für deine Teilnahme",
        roundNotFound: "Umfrage nicht gefunden",
        loading: "Laden...",
        evaluation: "Auswertung 📊",
        decisionReached: "Entscheidung gefallen! 🏆",
        decisionText: "Option {option} hat den geringsten Widerstand und erfüllt die Akzeptanzkriterien.",
        participants: "Teilnehmer",
        refresh: "Aktualisieren",
        option: "Option",
        totalResistance: "Gesamtwiderstand",
        avg: "Ø",
        adminActions: "Admin-Aktionen",
        adminHelper: "Als Host kannst du mit der Gruppe diskutieren. Wenn Einwände geklärt sind, kannst du die Widerstandswerte in der Matrix oben durch Anklicken manuell bearbeiten.",
        deleteRound: "Umfrage löschen",
        deleteConfirm: "Bist du sicher, dass du diese Umfrage und alle Daten LÖSCHEN möchtest? Dies kann nicht rückgängig gemacht werden.",
        roundDeleted: "Umfrage gelöscht.",
        links: "Links",
        matrixTitle: "Detaillierte Abstimmungsmatrix",
        matrixHelper: "Klicke auf einen Wert, um ihn zu bearbeiten.",
    }
};

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [lang, setLang] = useState(localStorage.getItem('lang') || 'de'); // Default to German as per implicit request

    const t = (key, params = {}) => {
        let text = translations[lang][key] || key;
        Object.keys(params).forEach(param => {
            text = text.replace(`{${param}}`, params[param]);
        });
        return text;
    };

    const toggleLang = () => {
        const newLang = lang === 'en' ? 'de' : 'en';
        setLang(newLang);
        localStorage.setItem('lang', newLang);
    };

    return (
        <LanguageContext.Provider value={{ lang, toggleLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = () => useContext(LanguageContext);
