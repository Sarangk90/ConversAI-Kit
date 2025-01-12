import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import pytest

# Add src directory to Python path
src_path = Path(__file__).parent / "src"
sys.path.insert(0, str(src_path))

@pytest.fixture(autouse=True)
def setup_test_env():
    """Automatically set up test environment variables before each test"""
    # Load test environment variables
    load_dotenv()
    
    # Set up test environment variables
    os.environ['OPENAI_API_KEY'] = 'test-api-key'
    os.environ['OPENAI_API_BASE'] = 'https://test-api-base.com'
    
    yield
    
    # Clean up after tests
    if 'OPENAI_API_KEY' in os.environ:
        del os.environ['OPENAI_API_KEY']
    if 'OPENAI_API_BASE' in os.environ:
        del os.environ['OPENAI_API_BASE'] 