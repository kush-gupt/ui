// src/components/Dashboard/Native/dashboard.tsx
import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import path from 'path';
import {
  AlertProps,
  PageBreadcrumb,
  Breadcrumb,
  BreadcrumbItem,
  PageSection,
  Title,
  Content,
  Popover,
  Button,
  AlertGroup,
  Alert,
  AlertVariant,
  AlertActionCloseButton,
  Spinner,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateActions,
  Card,
  CardBody,
  Flex,
  FlexItem,
  Modal,
  ModalVariant,
  ModalBody,
  ModalFooter,
  ModalHeader,
  DropdownItem,
  Dropdown,
  MenuToggleElement,
  MenuToggle,
  DropdownList,
  CardHeader,
  CardTitle,
  Gallery,
  GalleryItem
} from '@patternfly/react-core';
import { ExternalLinkAltIcon, OutlinedQuestionCircleIcon, GithubIcon, EllipsisVIcon } from '@patternfly/react-icons';
import { ExpandableSection } from '@patternfly/react-core/dist/esm/components/ExpandableSection/ExpandableSection';
import { v4 as uuidv4 } from 'uuid';

const InstructLabLogo: React.FC = () => <Image src="/InstructLab-LogoFile-RGB-FullColor.svg" alt="InstructLab Logo" width={256} height={256} />;

interface ChangeData {
  file: string;
  status: string;
  content?: string;
  commitSha?: string;
}

interface AlertItem {
  title: string;
  variant: AlertProps['variant'];
  key: React.Key;
}

const DashboardNative: React.FunctionComponent = () => {
  const [branches, setBranches] = React.useState<{ name: string; creationDate: number; message: string; author: string }[]>([]);
  const [taxonomyRepoDir, setTaxonomyRepoDir] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [mergeStatus] = React.useState<{ branch: string; message: string; success: boolean } | null>(null);
  const [diffData, setDiffData] = React.useState<{ branch: string; changes: ChangeData[] } | null>(null);
  const [isActionMenuOpen, setIsActionMenuOpen] = React.useState<{ [key: string]: boolean }>({});
  const [isChangeModalOpen, setIsChangeModalOpen] = React.useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = React.useState(false);
  const [alerts, setAlerts] = React.useState<AlertItem[]>([]);
  const [selectedBranch, setSelectedBranch] = React.useState<string | null>(null);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [expandedFiles, setExpandedFiles] = React.useState<Record<string, boolean>>({});

  const router = useRouter();

  const addAlert = (title: string, variant: AlertProps['variant']) => {
    const alertKey = uuidv4();
    const newAlert: AlertItem = { title, variant, key: alertKey };
    setAlerts((prevAlerts) => [...prevAlerts, newAlert]);
  };

  const removeAlert = (key: React.Key) => {
    setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.key !== key));
  };

  const addSuccessAlert = (message: string) => {
    addAlert(message, 'success');
  };

  const addDangerAlert = React.useCallback((message: string) => {
    addAlert(message, 'danger');
  }, []);

  const fetchBranches = React.useCallback(async () => {
    try {
      const response = await fetch('/api/native/git/branches');
      const result = await response.json();
      if (response.ok) {
        // Filter out 'main' branch
        const filteredBranches = result.branches.filter((branch: { name: string }) => branch.name !== 'main');
        setBranches(filteredBranches);
      } else {
        console.error('Failed to fetch branches:', result.error);
        addDangerAlert(result.error || 'Failed to fetch branches.');
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      addDangerAlert('Error fetching branches.');
    } finally {
      setIsLoading(false);
    }
  }, [addDangerAlert]);

  async function cloneNativeTaxonomyRepo(): Promise<boolean> {
    try {
      const response = await fetch('/api/native/clone-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      if (response.ok) {
        console.log(result.message);
        return true;
      } else {
        console.error(result.message);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error cloning repo:', errorMessage);
      return false;
    }
  }

  // Fetch branches from the API route
  React.useEffect(() => {
    const getEnvVariables = async () => {
      const res = await fetch('/api/envConfig');
      const envConfig = await res.json();
      const taxonomyRepoDir = path.join(envConfig.TAXONOMY_ROOT_DIR + '/taxonomy');
      setTaxonomyRepoDir(taxonomyRepoDir);
    };
    getEnvVariables();

    cloneNativeTaxonomyRepo().then((success) => {
      if (success) {
        fetchBranches();
      }
    });
  }, [fetchBranches]);

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handleShowChanges = async (branchName: string) => {
    try {
      const response = await fetch('/api/native/git/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchName, action: 'diff' })
      });

      const result = await response.json();
      if (response.ok) {
        setDiffData({ branch: branchName, changes: result.changes });
        setIsChangeModalOpen(true);
      } else {
        console.error('Failed to get branch changes:', result.error);
      }
    } catch (error) {
      console.error('Error fetching branch changes:', error);
    }
  };

  const handleDeleteContribution = async (branchName: string) => {
    setSelectedBranch(branchName);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteContributionConfirm = async () => {
    if (selectedBranch) {
      await deleteContribution(selectedBranch);
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteContributionCancel = () => {
    setSelectedBranch(null);
    setIsDeleteModalOpen(false);
  };

  const deleteContribution = async (branchName: string) => {
    try {
      const response = await fetch('/api/native/git/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchName, action: 'delete' })
      });

      const result = await response.json();
      if (response.ok) {
        // Remove the branch from the list
        setBranches((prevBranches) => prevBranches.filter((branch) => branch.name !== branchName));
        addSuccessAlert(result.message);
      } else {
        console.error(result.error);
        addDangerAlert(result.error);
      }
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = 'Error deleting branch ' + branchName + ':' + error.message;
        console.error(errorMessage);
        addDangerAlert(errorMessage);
      } else {
        console.error('Unknown error deleting the contribution ${branchName}');
        addDangerAlert('Unknown error deleting the contribution ${branchName}');
      }
    }
  };

  const handleEditContribution = (branchName: string) => {
    setSelectedBranch(branchName);

    // Check if branchName contains string "knowledge"
    if (branchName.includes('knowledge')) {
      router.push(`/edit-submission/knowledge/native/${branchName}`);
    } else {
      router.push(`/edit-submission/skill/native/${branchName}`);
    }
  };

  const handlePublishContribution = async (branchName: string) => {
    setSelectedBranch(branchName);
    setIsPublishModalOpen(true);
  };

  const handlePublishContributionConfirm = async () => {
    setIsPublishing(true);
    if (selectedBranch) {
      try {
        const response = await fetch('/api/native/git/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ branchName: selectedBranch, action: 'publish' })
        });

        const result = await response.json();
        if (response.ok) {
          setIsPublishing(false);
          addSuccessAlert(result.message || 'Successfully published contribution.');
          setSelectedBranch(null);
          setIsPublishModalOpen(false);
        } else {
          console.error('Failed to publish the contribution:', result.error);
          addDangerAlert(result.error || 'Failed to publish the contribution.');
        }
      } catch (error) {
        console.error('Error while publishing the contribution:', error);
        addDangerAlert(`Error while publishing the contribution: ${error}`);
      }
    } else {
      addDangerAlert('No branch selected to publish');
    }
    setIsPublishing(false);
    setSelectedBranch(null);
    setIsPublishModalOpen(false);
  };

  const handlePublishContributionCancel = () => {
    setSelectedBranch(null);
    setIsPublishModalOpen(false);
  };

  const toggleFileContent = (filename: string) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [filename]: !prev[filename]
    }));
  };

  const onActionMenuToggle = (id: string, isOpen: boolean) => {
    setIsActionMenuOpen((prevState) => ({
      ...prevState,
      [id]: isOpen
    }));
  };

  const onActionMenuSelect = (id: string) => {
    setIsActionMenuOpen((prevState) => ({
      ...prevState,
      [id]: false
    }));
  };

  return (
    <div>
      <PageBreadcrumb hasBodyWrapper={false}>
        <Breadcrumb>
          <BreadcrumbItem to="/"> Dashboard </BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>
      <PageSection hasBodyWrapper={false}>
        <Title headingLevel="h1" size="lg">
          My Submissions
        </Title>
        <Content>
          View and manage your taxonomy contributions.
          <Popover
            aria-label="Basic popover"
            bodyContent={
              <div>
                Taxonomy contributions help tune the InstructLab model. Contributions can include skills that teach the model how to do something or
                knowledge that teaches the model facts, data, or references.{' '}
                <a href="https://docs.instructlab.ai" target="_blank" rel="noopener noreferrer">
                  Learn more<ExternalLinkAltIcon style={{ padding: '3px' }}></ExternalLinkAltIcon>
                </a>
              </div>
            }
          >
            <Button variant="plain" aria-label="more information">
              <OutlinedQuestionCircleIcon />
            </Button>
          </Popover>
        </Content>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <AlertGroup isToast isLiveRegion>
          {alerts.map(({ key, variant, title }) => (
            <Alert
              variant={AlertVariant[variant!]}
              title={title}
              timeout={true}
              actionClose={<AlertActionCloseButton title={title as string} variantLabel={`${variant} alert`} onClose={() => removeAlert(key!)} />}
              key={key}
            />
          ))}
        </AlertGroup>

        {isLoading ? (
          <Spinner size="lg" />
        ) : branches.length === 0 ? (
          <EmptyState headingLevel="h4" titleText="Welcome to InstructLab" icon={InstructLabLogo}>
            <EmptyStateBody>
              <div style={{ maxWidth: '60ch' }}>
                InstructLab is a powerful and accessible tool for advancing generative AI through community collaboration and open-source principles.
                By contributing your own data, you can help train and refine the language model. <br />
                <br />
                To get started, contribute a skill or contribute knowledge.
              </div>
            </EmptyStateBody>
            <EmptyStateFooter>
              <EmptyStateActions>
                <Button variant="primary" onClick={() => router.push('/contribute/skill/')}>
                  Contribute Skill
                </Button>
                <Button variant="primary" onClick={() => router.push('/contribute/knowledge/')}>
                  Contribute Knowledge
                </Button>
                <Button variant="primary" onClick={() => router.push('/playground/chat')}>
                  Chat with the Models
                </Button>
              </EmptyStateActions>
              <EmptyStateActions>
                <Button
                  variant="link"
                  icon={<GithubIcon />}
                  iconPosition="right"
                  component="a"
                  href="https://github.com/instructlab"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View the Project on Github
                </Button>
              </EmptyStateActions>
            </EmptyStateFooter>
          </EmptyState>
        ) : (
          <Gallery
            hasGutter
            minWidths={{
              md: '400px',
              lg: '450px',
              xl: '500px',
              '2xl': '600px'
            }}
          >
            {branches.map((branch) => (
              <GalleryItem key={branch.name}>
                <Card key={branch.name}>
                  <CardHeader
                    actions={{
                      actions: (
                        <Dropdown
                          onSelect={() => onActionMenuSelect(branch.name)}
                          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                            <MenuToggle
                              ref={toggleRef}
                              isExpanded={isActionMenuOpen[branch.name] || false}
                              onClick={() => onActionMenuToggle(branch.name, !isActionMenuOpen[branch.name])}
                              variant="plain"
                              aria-label="contribution action menu"
                              icon={<EllipsisVIcon aria-hidden="true" />}
                            />
                          )}
                          isOpen={isActionMenuOpen[branch.name] || false}
                          onOpenChange={(isOpen: boolean) => onActionMenuToggle(branch.name, isOpen)}
                          popperProps={{ position: 'end' }}
                        >
                          <DropdownList>
                            <DropdownItem key="show-changes" onClick={() => handleShowChanges(branch.name)}>
                              Show Changes
                            </DropdownItem>
                            <DropdownItem key="edit-contribution" onClick={() => handleEditContribution(branch.name)}>
                              Edit Contribution
                            </DropdownItem>
                            <DropdownItem key="publish-contribution" onClick={() => handlePublishContribution(branch.name)}>
                              Publish Contribution
                            </DropdownItem>
                            <DropdownItem key="delete-contribution" onClick={() => handleDeleteContribution(branch.name)}>
                              Delete Contribution
                            </DropdownItem>
                          </DropdownList>
                        </Dropdown>
                      )
                    }}
                  >
                    <CardTitle>
                      <b>{branch.message}</b>
                    </CardTitle>
                  </CardHeader>
                  <CardBody>
                    <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                      <FlexItem>
                        Branch Name: {branch.name}
                        <br />
                        Author: {branch.author} {'    '}
                        <br />
                        Created on: {formatDateTime(branch.creationDate)}
                      </FlexItem>
                    </Flex>
                  </CardBody>
                </Card>
              </GalleryItem>
            ))}
          </Gallery>
        )}

        {mergeStatus && (
          <PageSection hasBodyWrapper={false}>
            <p style={{ color: mergeStatus.success ? 'green' : 'red' }}>{mergeStatus.message}</p>
          </PageSection>
        )}

        <Modal
          variant={ModalVariant.medium}
          title={`Files Contained in Branch: ${diffData?.branch}`}
          isOpen={isChangeModalOpen}
          onClose={() => setIsChangeModalOpen(false)}
          aria-labelledby="changes-contribution-modal-title"
          aria-describedby="changes-contribution-body-variant"
        >
          <ModalBody>
            {diffData?.changes.length ? (
              <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
                {diffData.changes.map((change) => (
                  <li key={`${change.file}-${change.commitSha}`} style={{ marginBottom: '1rem' }}>
                    <div>
                      <strong>{change.file}</strong> - <em>{change.status}</em> - Commit SHA: {change.commitSha}
                    </div>
                    {change.status !== 'deleted' && change.content && (
                      <ExpandableSection
                        toggleText={expandedFiles[change.file] ? 'Hide file contents' : 'Show file contents'}
                        onToggle={() => toggleFileContent(change.file)}
                        isExpanded={expandedFiles[change.file] || false}
                      >
                        <pre
                          style={{
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            backgroundColor: '#f5f5f5',
                            padding: '10px',
                            borderRadius: '4px',
                            maxHeight: '700px',
                            overflowY: 'auto',
                            userSelect: 'text'
                          }}
                        >
                          {change.content}
                        </pre>
                      </ExpandableSection>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No differences found.</p>
            )}
          </ModalBody>
        </Modal>

        <Modal
          variant={ModalVariant.small}
          title="Deleting Contribution"
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          aria-labelledby="delete-contribution-modal-title"
          aria-describedby="delete-contribution-body-variant"
        >
          <ModalHeader title="Deleting Contribution" labelId="delete-contribution-modal-title" titleIconVariant="warning" />
          <ModalBody id="delete-contribution-body-variant">
            <p>are you sure you want to delete this contribution?</p>
          </ModalBody>
          <ModalFooter>
            <Button key="confirm" variant="primary" onClick={() => handleDeleteContributionConfirm()}>
              Delete
            </Button>
            <Button key="cancel" variant="secondary" onClick={() => handleDeleteContributionCancel()}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>

        <Modal
          variant={ModalVariant.small}
          title="Publishing Contribution"
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          aria-labelledby="publish-contribution-modal-title"
          aria-describedby="publish-contribution-body-variant"
        >
          <ModalHeader title="Publishing Contribution" labelId="publish-contribution-modal-title" titleIconVariant="warning" />
          <ModalBody id="publish-contribution-body-variant">
            <p>are you sure you want to publish contribution to remote taxonomy repository present at : {taxonomyRepoDir}?</p>
          </ModalBody>
          <ModalFooter>
            <Button key="confirm" variant="primary" onClick={() => handlePublishContributionConfirm()}>
              Publish {'  '}
              {isPublishing && <Spinner isInline aria-label="Publishing contribution" />}
            </Button>
            <Button key="cancel" variant="secondary" onClick={() => handlePublishContributionCancel()}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      </PageSection>
    </div>
  );
};

export { DashboardNative };
