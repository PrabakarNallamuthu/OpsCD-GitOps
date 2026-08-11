/**
 * Mock Vault API responses and Kubernetes Secret file contents for offline testing.
 */
export const vaultDatabaseCredentialResponse = {
  request_id: 'fixture-request-id',
  lease_id: 'database/creds/release-service/fixture-lease',
  renewable: true,
  lease_duration: 86400,
  data: {
    username: 'v-kubernetes-release-service-AbCdEfG12345',
    password: 'A-MockVaultPassword-XyZ!987',
  },
};

export const k8sSecretFileContent: string = JSON.stringify({
  username: vaultDatabaseCredentialResponse.data.username,
  password: vaultDatabaseCredentialResponse.data.password,
});

export const rotatedK8sSecretFileContent: string = JSON.stringify({
  username: 'v-kubernetes-release-service-NmOpQr67890',
  password: 'A-RotatedVaultPassword-!Abc123',
});
