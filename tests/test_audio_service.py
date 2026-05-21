import pytest
import os
from pathlib import Path
from audio_service import AudioStorageService


@pytest.mark.asyncio
async def test_audio_service_init(test_audio_root):
    """测试音频服务初始化"""
    # 临时设置环境变量
    os.environ['AUDIO_ROOT'] = str(test_audio_root)
    
    service = AudioStorageService()
    
    assert service.audio_root.exists()
    assert (service.audio_root / 'performances').exists()
    assert (service.audio_root / 'ai_generated').exists()
    assert (service.audio_root / 'temp').exists()


@pytest.mark.asyncio
async def test_get_file_key():
    """测试生成文件key"""
    service = AudioStorageService()
    key = service._get_file_key('performances', 1, 'test.mp3')
    
    assert key.startswith('performances/1/')
    assert key.endswith('.mp3')


@pytest.mark.asyncio
async def test_get_physical_path(test_audio_root):
    """测试获取物理路径"""
    os.environ['AUDIO_ROOT'] = str(test_audio_root)
    service = AudioStorageService()
    
    file_key = 'performances/1/test.mp3'
    physical_path = service._get_physical_path(file_key)
    
    assert physical_path == test_audio_root / file_key


@pytest.mark.asyncio
async def test_save_audio(async_session, create_test_audio, test_audio_root):
    """测试保存音频文件"""
    os.environ['AUDIO_ROOT'] = str(test_audio_root)
    service = AudioStorageService()
    
    # 创建测试音频文件
    test_file_path = create_test_audio(b"test audio content", ".mp3")
    
    try:
        result = await service.save(
            async_session,
            test_file_path,
            user_id=1,
            business_type='performance',
            original_name='test.mp3'
        )
        
        assert result['id'] is not None
        assert result['file_key'] is not None
        assert result['file_name'] == 'test.mp3'
        assert result['user_id'] == 1
        assert result['business_type'] == 'performance'
        
        # 验证物理文件存在
        physical_path = service._get_physical_path(result['file_key'])
        assert physical_path.exists()
    finally:
        if os.path.exists(test_file_path):
            os.unlink(test_file_path)


@pytest.mark.asyncio
async def test_get_audio_metadata(async_session, create_test_audio, test_audio_root):
    """测试获取音频元数据"""
    os.environ['AUDIO_ROOT'] = str(test_audio_root)
    service = AudioStorageService()
    
    test_file_path = create_test_audio(b"test audio content", ".mp3")
    
    try:
        save_result = await service.save(
            async_session,
            test_file_path,
            user_id=1,
            business_type='performance'
        )
        
        audio_id = save_result['id']
        metadata = await service.get(async_session, audio_id)
        
        assert metadata is not None
        assert metadata['id'] == audio_id
        assert metadata['user_id'] == 1
    finally:
        if os.path.exists(test_file_path):
            os.unlink(test_file_path)


@pytest.mark.asyncio
async def test_delete_audio_soft(async_session, create_test_audio, test_audio_root):
    """测试软删除音频"""
    os.environ['AUDIO_ROOT'] = str(test_audio_root)
    service = AudioStorageService()
    
    test_file_path = create_test_audio(b"test audio content", ".mp3")
    
    try:
        save_result = await service.save(
            async_session,
            test_file_path,
            user_id=1,
            business_type='performance'
        )
        audio_id = save_result['id']
        
        await service.delete(async_session, audio_id, soft_delete=True)
        
        # 验证文件仍存在但状态是deleted
        physical_path = service._get_physical_path(save_result['file_key'])
        assert physical_path.exists()
        
        metadata = await service.get(async_session, audio_id)
        assert metadata is None  # get只返回active的
    finally:
        if os.path.exists(test_file_path):
            os.unlink(test_file_path)


@pytest.mark.asyncio
async def test_delete_audio_hard(async_session, create_test_audio, test_audio_root):
    """测试硬删除音频"""
    os.environ['AUDIO_ROOT'] = str(test_audio_root)
    service = AudioStorageService()
    
    test_file_path = create_test_audio(b"test audio content", ".mp3")
    
    try:
        save_result = await service.save(
            async_session,
            test_file_path,
            user_id=1,
            business_type='performance'
        )
        audio_id = save_result['id']
        
        await service.delete(async_session, audio_id, soft_delete=False)
        
        # 验证物理文件被删除
        physical_path = service._get_physical_path(save_result['file_key'])
        assert not physical_path.exists()
    finally:
        if os.path.exists(test_file_path):
            os.unlink(test_file_path)


@pytest.mark.asyncio
async def test_duplicate_file_detection(async_session, create_test_audio, test_audio_root):
    """测试重复文件检测"""
    os.environ['AUDIO_ROOT'] = str(test_audio_root)
    service = AudioStorageService()
    
    test_content = b"test duplicate audio content"
    test_file_path1 = create_test_audio(test_content, ".mp3")
    test_file_path2 = create_test_audio(test_content, ".mp3")
    
    try:
        # 第一次保存
        result1 = await service.save(
            async_session,
            test_file_path1,
            user_id=1,
            business_type='performance'
        )
        
        # 第二次保存相同内容应该复用
        result2 = await service.save(
            async_session,
            test_file_path2,
            user_id=2,
            business_type='performance'
        )
        
        assert result1['id'] == result2['id']
    finally:
        if os.path.exists(test_file_path1):
            os.unlink(test_file_path1)
        if os.path.exists(test_file_path2):
            os.unlink(test_file_path2)
