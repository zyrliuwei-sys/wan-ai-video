/**
 * Test script for Evolink API
 * Run with: node test-evolink-api.js
 */

async function testEvolinkAPI() {
  const evolinkAPI = await import('@/extensions/ai/evolink');

  console.log('===== Testing Evolink API Configuration =====');
  console.log('API Key:', evolinkAPI.apiKey ? 'Set' : 'Not set');
  console.log('Base URL:', evolinkAPI.baseURL);

  try {
    // Test create video generation
    console.log('\n--- Testing createVideoGeneration ---');
    const createResult = await evolinkAPI.createVideoGeneration({
      model: 'wan2.6-text-to-video',
      prompt: 'Test prompt for video generation',
      aspectRatio: '16:9',
      quality: '720p',
      duration: 5,
    });

    console.log('Create result:', createResult);
    console.log('Create result status:', createResult.status);
    console.log('Create result ID:', createResult.id);

    // Test get task status (with a dummy task ID for testing)
    console.log('\n--- Testing getTaskStatus ---');
    try {
      const statusResult = await evolinkAPI.getTaskStatus('test-task-id-123');
      console.log('Status result:', statusResult);
    } catch (statusError) {
      console.error('Get task status failed:', statusError);
    }

    return {
      success: true,
      message: 'Evolink API test completed successfully',
      config: {
        apiKey: evolinkAPI.apiKey ? 'Set' : 'Not set',
        baseURL: evolinkAPI.baseURL,
        hasApiKey: !!evolinkAPI.apiKey,
        hasBaseURL: !!evolinkAPI.baseURL,
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Evolink API test failed',
      error: error.message
    };
  }
}

export { testEvolinkAPI as default };
