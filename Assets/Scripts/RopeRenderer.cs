using UnityEngine;

[RequireComponent(typeof(LineRenderer))]
public class RopeRenderer : MonoBehaviour
{
    public HookHero hero;
    LineRenderer lr;

    void Awake() { lr = GetComponent<LineRenderer>(); lr.positionCount = 2; lr.startWidth = 0.08f; }

    void LateUpdate()
    {
        lr.enabled = hero.Attached;
        if (hero.Attached)
        {
            lr.SetPosition(0, hero.transform.position);
            lr.SetPosition(1, hero.AnchorPos);
        }
    }
}