import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Practice/Sidebar';
import TopicContent from '../components/Practice/TopicContent';
import PracticeTerminal from '../components/Practice/PracticeTerminal';

// Mock Data structure for the UI
const MOCK_TOPICS = [
    {
        id: 'intro',
        title: 'Introduction',
        icon: '👋',
        description: 'Common HR and behavioral questions to kick off an interview.',
        questions: []
    },
    {
        id: 'oop',
        title: 'OOP Interview Questions',
        icon: '🎯',
        description: 'Master Object-Oriented Programming concepts like inheritance, polymorphism, encapsulation, and abstraction.',
        questions: [
            {
                id: 'oop-1',
                title: 'What are the four pillars of OOP?',
                explanation: 'Explain encapsulation, abstraction, inheritance, and polymorphism with real-world examples.',
                difficulty: 'Easy'
            },
            {
                id: 'oop-2',
                title: 'Difference between Abstract Class and Interface',
                explanation: 'Discuss when to use which, multiple inheritance, and default method implementations.',
                difficulty: 'Medium'
            }
        ]
    },
    {
        id: 'dbms',
        title: 'DBMS Interview Questions',
        icon: '🗄️',
        description: 'Core concepts of Database Management Systems, Normalization, and SQL queries.',
        questions: [
            {
                id: 'dbms-1',
                title: 'Explain ACID properties',
                explanation: 'Atomicity, Consistency, Isolation, and Durability in transaction management.',
                difficulty: 'Medium'
            }
        ]
    },
    {
        id: 'os',
        title: 'Operating System',
        icon: '💻',
        description: 'Processes, threads, memory management, and deadlocks.',
        questions: []
    },
    {
        id: 'network',
        title: 'Computer Network',
        icon: '🌐',
        description: 'OSI Model, TCP/IP, routing protocols, and network security basics.',
        questions: []
    },
    {
        id: 'js',
        title: 'JavaScript',
        icon: '⚡',
        description: 'Closures, promises, event loop, and modern ES6+ features.',
        questions: [
            {
                id: 'js-1',
                title: 'Explain the Event Loop',
                explanation: 'How the call stack, Web APIs, task queue, and microtask queue interact.',
                difficulty: 'Hard'
            }
        ]
    },
    {
        id: 'react',
        title: 'React',
        icon: '⚛️',
        description: 'Hooks, virtual DOM, component lifecycle, and state management.',
        questions: []
    }
];

const COMPANY_LIST = [
    {
        id: 'google',
        title: 'Google',
        icon: '🔍',
        description: 'Focus on Data Structures, Algorithms, and System Design with Google-style complexity.',
        questions: [
            { title: 'Median of Two Sorted Arrays', difficulty: 'Hard', explanation: 'Find the median of two sorted arrays of different sizes.', topic: 'Algorithms' },
            { title: 'Google File System (GFS)', difficulty: 'Hard', explanation: 'Explain the architecture and design trade-offs of GFS.', topic: 'System Design' }
        ]
    },
    {
        id: 'amazon',
        title: 'Amazon',
        icon: '📦',
        description: 'Practice Leadership Principles and scalable system design questions often asked at Amazon.',
        questions: [
            { title: 'Design a Warehousing System', difficulty: 'Hard', explanation: 'Design a system to manage inventory across multiple warehouses.', topic: 'System Design' },
            { title: 'Number of Islands', difficulty: 'Medium', explanation: 'Count the number of islands in a 2D grid.', topic: 'BFS/DFS' }
        ]
    },
    {
        id: 'microsoft',
        title: 'Microsoft',
        icon: '🪟',
        description: 'Deep dive into OS internals, C#/.NET, and robust algorithmic problem solving.',
        questions: [
            { title: 'Reverse Nodes in k-Group', difficulty: 'Hard', explanation: 'Reverse nodes of a linked list k at a time.', topic: 'Linked List' },
            { title: 'Virtual Memory management', difficulty: 'Medium', explanation: 'How does paging work in modern OS?', topic: 'OS' }
        ]
    },
    {
        id: 'tcs',
        title: 'TCS',
        icon: '🏢',
        description: 'Focused on core CS fundamentals, Java/Python basics, and aptitude.',
        questions: [
            { title: 'Explain SDLC phases', difficulty: 'Easy', explanation: 'Detailed walkthrough of the Software Development Life Cycle.', topic: 'Software Eng' },
            { title: 'Palindrome Check', difficulty: 'Easy', explanation: 'Write a function to check if a string is a palindrome.', topic: 'Strings' }
        ]
    },
    {
        id: 'infosys',
        title: 'Infosys',
        icon: '🚀',
        description: 'Core programming logic, DBMS, and behavioral questions for service-based roles.',
        questions: [
            { title: 'Normal Forms in DBMS', difficulty: 'Medium', explanation: 'Explain 1NF, 2NF, and 3NF with examples.', topic: 'DBMS' },
            { title: 'OOPs Concepts', difficulty: 'Easy', explanation: 'Explain Abstraction, Encapsulation, Inheritance, and Polymorphism.', topic: 'OOP' }
        ]
    }
];

import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const PracticeDashboard = () => {
    const { topicId, questionId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore();
    const [activeMode, setActiveMode] = useState('topics');
    const [dbQuestions, setDbQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const activeTopicId = topicId || (activeMode === 'topics' ? 'oop' : 'google');

    const activeItemData = activeMode === 'topics'
        ? (MOCK_TOPICS.find(t => t.id === activeTopicId) || MOCK_TOPICS[0])
        : (COMPANY_LIST.find(c => c.id === activeTopicId) || COMPANY_LIST[0]);

    useEffect(() => {
        const fetchQuestions = async () => {
            setIsLoading(true);
            try {
                let endpoint = '';
                if (activeMode === 'topics') {
                    endpoint = `/questions/topic/${activeItemData.title}`;
                } else {
                    endpoint = `/questions/company/${activeItemData.title}`;
                }
                const res = await API.get(endpoint);
                setDbQuestions(res.data);
            } catch (err) {
                console.error("Error fetching questions:", err);
                setDbQuestions([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuestions();
    }, [activeTopicId, activeMode, activeItemData.title]);

    const currentTopicData = {
        ...activeItemData,
        questions: dbQuestions.length > 0 ? dbQuestions : (activeItemData.questions || [])
    };

    const activePracticeQuestion = questionId ? currentTopicData.questions.find(q => q.id === questionId || q._id === questionId) : null;

    const handlePractice = (question) => {
        navigate(`/practice/${activeTopicId}/${question.id || question._id}`);
    };

    const handleViewAnswer = (question) => {
        toast.error(`Answer functionality for "${question.title}" coming soon!`);
    };

    const handleBackToTopics = () => {
        navigate(`/practice/${activeTopicId}`);
    };

    const onQuestionsGenerated = (topic, newQuestions) => {
        setDbQuestions(prev => [...prev, ...newQuestions]);
    };

    return (
        <div className="flex bg-slate-50 min-h-screen">
            {/* Left Sidebar */}
            <Sidebar
                activeTopic={activeTopicId}
                setActiveTopic={(id) => {
                    navigate(`/practice/${id}`);
                }}
                topics={MOCK_TOPICS}
                companies={COMPANY_LIST}
                activeMode={activeMode}
                setActiveMode={(mode) => {
                    setActiveMode(mode);
                    navigate(`/practice/${mode === 'topics' ? 'oop' : 'google'}`);
                }}
                targetCompanies={currentUser?.targetCompanies || []}
            />

            {/* Main Content Area */}
            {activePracticeQuestion ? (
                <PracticeTerminal
                    questions={currentTopicData.questions}
                    initialIndex={currentTopicData.questions.findIndex(q => q.title === activePracticeQuestion.title)}
                    onBack={handleBackToTopics}
                />
            ) : (
                <div className="flex-1 flex flex-col relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-slate-50/50 z-10 flex items-center justify-center backdrop-blur-sm">
                            <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                        </div>
                    )}
                    <TopicContent
                        activeTopicData={currentTopicData}
                        isCompanyMode={activeMode !== 'topics'}
                        onPractice={handlePractice}
                        onViewAnswer={handleViewAnswer}
                        onGenerate={(questions) => onQuestionsGenerated(activeTopicId, questions)}
                    />
                </div>
            )}
        </div>
    );
};

export default PracticeDashboard;
