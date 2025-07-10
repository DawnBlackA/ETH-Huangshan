import React, { useState, useEffect, useCallback } from 'react';
import styles from './AgentPlatform.module.css';
import AppHeader from '../components/AppHeader';
import AgentCard from '../components/AgentCard';
import CreateAgentModal from '../components/CreateAgentModal';

const AgentPlatform = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/v1/agent/list'); // Use relative path
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log(result);
        if (result.code === 200 && Array.isArray(result.data)) {
          const formattedAgents = result.data.map(agent => ({
            id: agent.id,
            cid: agent.cid, // <-- Add this
            name: agent.name,
            bio: agent.description,
            avatar: agent.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
          }));
          setAgents(formattedAgents);
        } else {
          throw new Error(result.message || 'Failed to fetch agent list.');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = useCallback(() => setIsModalOpen(false), []);

  const handleAgentCreated = useCallback((newAgentData) => {
    const newAgent = {
      id: newAgentData.id || Date.now(), // Fallback ID
      cid: newAgentData.cid, // <-- Add this
      name: newAgentData.name,
      bio: newAgentData.description,
      avatar: newAgentData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
    };
    setAgents(prevAgents => [newAgent, ...prevAgents]);
    handleCloseModal();
  }, [handleCloseModal]);

  return (
    <div className={styles.container}>
      <AppHeader onNewAgentClick={handleOpenModal} />
      <main className={styles.agentList}>
        {loading && <p className={styles.message}>Loading agents...</p>}
        {error && <p className={styles.error}>Error: {error}</p>}
        {!loading && !error && agents.map(agent => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </main>
      <CreateAgentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAgentCreated={handleAgentCreated}
      />
    </div>
  );
};

export default AgentPlatform;