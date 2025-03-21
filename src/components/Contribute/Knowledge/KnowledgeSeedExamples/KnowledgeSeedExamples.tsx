// src/components/Contribute/Knowledge/Native/KnowledgeSeedExampleNative/KnowledgeSeedExamples.tsx
import React, { useState } from 'react';
import { ValidatedOptions } from '@patternfly/react-core';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText } from 'ai';
import { Accordion, AccordionContent, AccordionItem, AccordionToggle, Button, Flex, FlexItem } from '@patternfly/react-core';
import { ExternalLinkAltIcon, PlusCircleIcon, TrashIcon } from '@patternfly/react-icons';
import { QuestionAndAnswerPair, KnowledgeSeedExample, SkillSeedExample } from '@/types';
import KnowledgeFileSelectModal from '@/components/Contribute/Knowledge/KnowledgeSeedExamples/KnowledgeFileSelectModal';
import {
  createEmptyKnowledgeSeedExample,
  handleKnowledgeSeedExamplesAnswerInputChange,
  handleKnowledgeSeedExamplesAnswerBlur,
  handleKnowledgeSeedExamplesQuestionBlur,
  handleKnowledgeSeedExamplesQuestionInputChange,
  handleKnowledgeSeedExamplesContextBlur,
  handleKnowledgeSeedExamplesContextInputChange,
  toggleKnowledgeSeedExamplesExpansion,
  updateKnowledgeSeedExampleQA,
  handleKnowledgeSeedLoading,
  removeKnowledgeSeedExampleQA,
} from '@/components/Contribute/Utils/seedExampleUtils';
import KnowledgeQuestionAnswerPairs from '@/components/Contribute/Knowledge/KnowledgeSeedExamples/KnowledgeQuestionAnswerPairs';
import WizardPageHeader from '@/components/Common/WizardPageHeader';

interface KnowledgeFile {
  filename: string;
  content: string;
  commitSha: string;
  commitDate?: string;
}

const GITHUB_KNOWLEDGE_FILES_API = '/api/github/knowledge-files';
const NATIVE_GIT_KNOWLEDGE_FILES_API = '/api/native/git/knowledge-files';

interface Props {
  isGithubMode: boolean;
  seedExamples: KnowledgeSeedExample[];
  onUpdateSeedExamples: (seedExamples: KnowledgeSeedExample[]) => void;
  addDocumentInfo: (repoUrl: string, commitSha: string, docName: string) => void;
  repositoryUrl: string;
  commitSha: string;
  onGenerateQA?: (seedExampleIndex: number) => Promise<void>; // New prop for generation
}

const KnowledgeSeedExamples: React.FC<Props> = ({ isGithubMode, seedExamples, onUpdateSeedExamples, addDocumentInfo, repositoryUrl, commitSha }) => {
  const [fileSelectIndex, setFileSelectIndex] = useState<number>(-1);
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  React.useEffect(() => {
    const fetchKnowledgeFiles = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(isGithubMode ? GITHUB_KNOWLEDGE_FILES_API : NATIVE_GIT_KNOWLEDGE_FILES_API, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();
        if (response.ok) {
          setKnowledgeFiles(result.files);
          console.log('Fetched knowledge files:', result.files);
        } else {
          setError(result.error || 'Failed to fetch knowledge files.');
          console.error('Error fetching knowledge files:', result.error);
        }
      } catch (err) {
        setError('An error occurred while fetching knowledge files.');
        console.error('Error fetching knowledge files:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (fileSelectIndex >= 0 && !knowledgeFiles.length) {
      fetchKnowledgeFiles();
    }
  }, [fileSelectIndex, isGithubMode, knowledgeFiles.length]);

  const handleContextInputChange = (seedExampleIndex: number, contextValue: string, validate = false): void => {
    onUpdateSeedExamples(handleKnowledgeSeedExamplesContextInputChange(seedExamples, seedExampleIndex, contextValue, validate));
  };

  const handleSelectContextInput = (contextValue: string) => {
    onUpdateSeedExamples(handleKnowledgeSeedExamplesContextInputChange(seedExamples, fileSelectIndex, contextValue, true));
  };

  const handleContextBlur = (seedExampleIndex: number): void => {
    onUpdateSeedExamples(handleKnowledgeSeedExamplesContextBlur(seedExamples, seedExampleIndex));
  };

  const handleQuestionInputChange = (seedExampleIndex: number, questionAndAnswerIndex: number, questionValue: string): void => {
    onUpdateSeedExamples(handleKnowledgeSeedExamplesQuestionInputChange(seedExamples, seedExampleIndex, questionAndAnswerIndex, questionValue));
  };

  const handleQuestionBlur = (seedExampleIndex: number, questionAndAnswerIndex: number): void => {
    onUpdateSeedExamples(handleKnowledgeSeedExamplesQuestionBlur(seedExamples, seedExampleIndex, questionAndAnswerIndex));
  };

  const handleAnswerInputChange = (seedExampleIndex: number, questionAndAnswerIndex: number, answerValue: string): void => {
    onUpdateSeedExamples(handleKnowledgeSeedExamplesAnswerInputChange(seedExamples, seedExampleIndex, questionAndAnswerIndex, answerValue));
  };

  const handleAnswerBlur = (seedExampleIndex: number, questionAndAnswerIndex: number): void => {
    onUpdateSeedExamples(handleKnowledgeSeedExamplesAnswerBlur(seedExamples, seedExampleIndex, questionAndAnswerIndex));
  };

  const toggleSeedExampleExpansion = (index: number): void => {
    onUpdateSeedExamples(toggleKnowledgeSeedExamplesExpansion(seedExamples, index));
  };

  const handleDeleteQA = (seedExampleIndex: number, qaIndex: number): void => {
    onUpdateSeedExamples(removeKnowledgeSeedExampleQA(seedExamples, seedExampleIndex, qaIndex));
  };

  const addSeedExample = (): void => {
    const seedExample = createEmptyKnowledgeSeedExample();
    seedExample.immutable = false;
    seedExample.isExpanded = true;
    onUpdateSeedExamples([...seedExamples, seedExample]);
  };

  const deleteSeedExample = (seedExampleIndex: number): void => {
    onUpdateSeedExamples(seedExamples.filter((_, index: number) => index !== seedExampleIndex));
  };

  const handleGenerateQA = async (seedExampleIndex: number) => {
    onUpdateSeedExamples(handleKnowledgeSeedLoading(seedExamples, seedExampleIndex, true))
    const context = seedExamples[seedExampleIndex].context;
    console.log(context)
    if (!context) {
      // Handle error: context is required
      return;
    }
    try {
      const envURL = process.env.GENERATE_BASE_URL;
      const provider = createOpenAICompatible({
        name: process.env.GENERATE_NAME || "",
        // apiKey: process.env.GENERATE_API_KEY,
        baseURL: envURL || "http://localhost:8080/v1",
      });
  
      const { text } = await generateText({
        model: provider('default'),
        prompt: '<CON>' + context + '</CON>\n\n',
        temperature: 0.8,
        maxTokens: 1000
        
      });
      
      const qindex = text.indexOf('<QUE>');
      const parsedtext = qindex === -1 ? text : text.substring(qindex);

      const parsedQA = parseGeneratedText(parsedtext);

      //  // Update the seedExamples with the new Q&A pairs
      onUpdateSeedExamples(updateKnowledgeSeedExampleQA(seedExamples, seedExampleIndex, parsedQA));
 
      console.log(parsedtext);
      //handleKnowledgeSeedLoading(seedExamples, seedExampleIndex, false);
    } catch (error) {
      console.error('Failed to generate QA:', error);
      onUpdateSeedExamples(handleKnowledgeSeedLoading(seedExamples, seedExampleIndex, false));
      // Show error to user (e.g., set error state in seedExample)
    } finally {
      //onUpdateSeedExamples(handleKnowledgeSeedLoading(seedExamples, seedExampleIndex, false));
    }
  };

  const parseGeneratedText = (text: string): QuestionAndAnswerPair[] => {
    const qaStrList = text.split('</END>');
    if (!text.endsWith('</END>')) {
      qaStrList.pop();
    }
  
    const qaList: QuestionAndAnswerPair[] = [];
    const rawQuestions: string[] = [];
  
    for (const qaStr of qaStrList) {
      try {
        const parts = qaStr.split('<ANS>');
        if (parts.length !== 2) {
          console.log(parts)
          // throw new Error(`invalid QA string: ${qaStr}`);
          continue
        }
        
        let [Q_str, A_str] = parts;
        Q_str = Q_str.trim();
        A_str = A_str.trim();
  
        if (!A_str || !Q_str.startsWith('<QUE>')) {
          console.log(parts)
          // const qindex = Q_str.indexOf('<QUE>');
          // Q_str = qindex === -1 ? Q_str : Q_str.substring(qindex);
          // throw new Error(`invalid question or answer string in QA_str: ${qaStr}`);
          continue
        }
  
        Q_str = Q_str.replace('<QUE>', '').trim();
  
        if (rawQuestions.includes(Q_str.toLowerCase())) {
          // throw new Error(`duplicate question: ${Q_str}`);
          continue
        }
  
        qaList.push({
          immutable: false,
          question: Q_str,
          isQuestionValid: ValidatedOptions.success,
          questionValidationError: '',
          answer: A_str,
          isAnswerValid: ValidatedOptions.success,
          answerValidationError: ''
        });
  
        rawQuestions.push(Q_str.toLowerCase());
      } catch (error) {
        console.error('Error parsing QA string:', error);
      }
    }
  
    return qaList;
  };

  return (
    <Flex gap={{ default: 'gapMd' }} direction={{ default: 'column' }}>
      <FlexItem>
        <WizardPageHeader
          title="Create seed data"
          description={
            <>
              Add seed examples with context and minimum 3 question and answer pairs. A minimum of five seed examples are required.{' '}
              <Button
                variant="link"
                isInline
                href="https://docs.instructlab.ai/taxonomy/knowledge/#knowledge-yaml-examples"
                target="_blank"
                rel="noopener noreferrer"
                icon={<ExternalLinkAltIcon />}
                iconPosition="end"
              >
                Learn more about seed examples
              </Button>
            </>
          }
        />
      </FlexItem>
      <FlexItem>
        <Accordion asDefinitionList={false}>
          {seedExamples.map((seedExample: KnowledgeSeedExample, seedExampleIndex: number) => (
            <AccordionItem key={seedExampleIndex} isExpanded={seedExample.isExpanded}>
              <AccordionToggle onClick={() => toggleSeedExampleExpansion(seedExampleIndex)} id={`seed-example-toggle-${seedExampleIndex}`}>
                <Flex gap={{ default: 'gapMd' }} justifyContent={{ default: 'justifyContentSpaceBetween' }} style={{ width: '100%' }}>
                  <FlexItem>
                    Seed Example {seedExampleIndex + 1}{' '}
                    {seedExample.immutable ? <span style={{ color: 'var(--pf-t--global--color--status--danger--default)' }}>*</span> : null}
                  </FlexItem>
                  {!seedExample.immutable ? (
                    <FlexItem>
                      <Button
                        component="a"
                        icon={<TrashIcon />}
                        variant="plain"
                        aria-label="Remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSeedExample(seedExampleIndex);
                        }}
                      />
                    </FlexItem>
                  ) : null}
                </Flex>
              </AccordionToggle>
              <AccordionContent id={`seed-example-content-${seedExampleIndex}`}>
                <KnowledgeQuestionAnswerPairs
                  seedExample={seedExample}
                  seedExampleIndex={seedExampleIndex}
                  onSelectContext={setFileSelectIndex}
                  handleContextInputChange={handleContextInputChange}
                  handleContextBlur={handleContextBlur}
                  handleQuestionInputChange={handleQuestionInputChange}
                  handleQuestionBlur={handleQuestionBlur}
                  handleAnswerInputChange={handleAnswerInputChange}
                  handleAnswerBlur={handleAnswerBlur}
                  onGenerateQA={handleGenerateQA}
                  onDeleteQA={handleDeleteQA}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <Button icon={<PlusCircleIcon />} variant="link" type="button" onClick={addSeedExample}>
            Add Seed Example
          </Button>
        </div>
      </FlexItem>
      {fileSelectIndex >= 0 ? (
        <KnowledgeFileSelectModal
          knowledgeFiles={knowledgeFiles}
          isLoading={isLoading}
          error={error}
          handleContextInputChange={handleSelectContextInput}
          addDocumentInfo={addDocumentInfo}
          repositoryUrl={repositoryUrl}
          commitSha={commitSha}
          handleCloseModal={() => setFileSelectIndex(-1)}
        />
      ) : null}
    </Flex>
  );
};

export default KnowledgeSeedExamples;
